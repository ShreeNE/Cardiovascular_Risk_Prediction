"""
CorVita FastAPI Backend Server
================================
Production-grade REST API for real-time cardiovascular risk inference.
Endpoints:
  GET  /          - API health check and metadata
  GET  /health    - System health and model registry status  
  POST /predict   - Single patient CAD + vessel stenosis prediction with SHAP
  POST /predict/batch - Batch inference for multiple patients
  GET  /features  - Returns the 67-feature list with clinical display names
  GET  /metadata  - Returns training pipeline metadata, CV scores, and benchmarks
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Ensure model package is importable from the model/ directory
_HERE = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_HERE)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from model.inference import run_inference, get_registry, FEATURE_DISPLAY_NAMES

# ─── Logging Setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("CorVita-API")

# ─── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CorVita Clinical CAD Prediction API",
    description=(
        "Production-grade cardiovascular risk inference API powered by a Soft Voting "
        "Ensemble of Gradient Boosting, XGBoost, Random Forest, and Extra Trees classifiers "
        "trained on the Z-Alizadeh Sani dataset. Provides SHAP-explainable predictions for "
        "overall CAD diagnosis and vessel-specific stenosis (LAD, LCX, RCA)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Schemas ───────────────────────────────────────────────────────────
class PatientData(BaseModel):
    """
    Raw clinical patient features.
    All fields are optional — missing values are imputed by the preprocessing pipeline.
    Accepts both dataset column exact names and common lowercase aliases.
    """
    # Demographics
    Age:    Optional[float] = Field(None, ge=18, le=100)
    Weight: Optional[float] = Field(None, ge=30, le=200)
    Length: Optional[float] = Field(None, ge=100, le=220)
    Sex:    Optional[str]   = Field(None, description="'Male' or 'Fmale'")
    BMI:    Optional[float] = Field(None, ge=10, le=60)

    # Comorbidities
    DM:              Optional[int] = Field(None, ge=0, le=1)
    HTN:             Optional[int] = Field(None, ge=0, le=1)
    Obesity:         Optional[str] = Field(None)
    CRF:             Optional[str] = Field(None)
    CVA:             Optional[str] = Field(None)
    DLP:             Optional[str] = Field(None)
    CHF:             Optional[str] = Field(None)
    FH:              Optional[int] = Field(None, ge=0, le=1)
    Airway_disease:  Optional[str] = Field(None, alias="Airway disease")
    Thyroid_Disease: Optional[str] = Field(None, alias="Thyroid Disease")

    # Vitals
    BP: Optional[float] = Field(None, ge=60, le=250)
    PR: Optional[float] = Field(None, ge=30, le=200)

    # Smoking
    Current_Smoker: Optional[int] = Field(None, ge=0, le=1, alias="Current Smoker")
    EX_Smoker:      Optional[int] = Field(None, ge=0, le=1, alias="EX-Smoker")

    # Physical exam
    Edema:                Optional[int] = Field(None, ge=0, le=1)
    Weak_Peripheral_Pulse:Optional[str] = Field(None, alias="Weak Peripheral Pulse")
    Lung_rales:           Optional[str] = Field(None, alias="Lung rales")
    Systolic_Murmur:      Optional[str] = Field(None, alias="Systolic Murmur")
    Diastolic_Murmur:     Optional[str] = Field(None, alias="Diastolic Murmur")

    # Symptoms
    Typical_Chest_Pain: Optional[int] = Field(None, ge=0, le=1, alias="Typical Chest Pain")
    Dyspnea:            Optional[str] = Field(None)
    Atypical:           Optional[str] = Field(None)
    Nonanginal:         Optional[str] = Field(None)
    Exertional_CP:      Optional[str] = Field(None, alias="Exertional CP")
    LowTH_Ang:          Optional[str] = Field(None, alias="LowTH Ang")
    Function_Class:     Optional[int] = Field(None, ge=0, le=4, alias="Function Class")

    # ECG
    Q_Wave:           Optional[int] = Field(None, ge=0, le=1, alias="Q Wave")
    St_Elevation:     Optional[int] = Field(None, ge=0, le=1, alias="St Elevation")
    St_Depression:    Optional[int] = Field(None, ge=0, le=1, alias="St Depression")
    Tinversion:       Optional[int] = Field(None, ge=0, le=1)
    LVH:              Optional[str] = Field(None)
    Poor_R_Progression:Optional[str] = Field(None, alias="Poor R Progression")
    BBB:              Optional[str] = Field(None)

    # Labs
    FBS:  Optional[float] = None
    CR:   Optional[float] = None
    TG:   Optional[float] = None
    LDL:  Optional[float] = None
    HDL:  Optional[float] = None
    BUN:  Optional[float] = None
    ESR:  Optional[float] = None
    HB:   Optional[float] = None
    K:    Optional[float] = None
    Na:   Optional[float] = None
    WBC:  Optional[float] = None
    Lymph:Optional[float] = None
    Neut: Optional[float] = None
    PLT:  Optional[float] = None

    # Echo
    EF_TTE:      Optional[float] = Field(None, alias="EF-TTE")
    Region_RWMA: Optional[int]   = Field(None, ge=0, le=4, alias="Region RWMA")
    VHD:         Optional[str]   = None

    class Config:
        populate_by_name = True


class BatchPatientData(BaseModel):
    patients: List[PatientData]


# ─── Startup Hook ───────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Pre-warms the model registry on server startup for zero cold-start latency."""
    logger.info("CorVita API starting up — pre-loading model registry...")
    try:
        registry = get_registry()
        logger.info(
            f"Model registry ready: {len(registry.models)} models, "
            f"{len(registry.feature_columns)} features"
        )
    except Exception as e:
        logger.error(f"Failed to load models on startup: {e}")


# ─── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/", tags=["Meta"])
async def root():
    return {
        "service":     "CorVita Clinical CAD Prediction API",
        "version":     "1.0.0",
        "description": "Cardiovascular risk scoring for CAD, LAD, LCX, RCA stenosis",
        "endpoints": {
            "predict":        "POST /predict",
            "batch_predict":  "POST /predict/batch",
            "health":         "GET /health",
            "features":       "GET /features",
            "metadata":       "GET /metadata",
            "docs":           "GET /docs",
        },
        "model": {
            "type":      "Soft Voting Ensemble",
            "base_models": ["GradientBoosting", "XGBoost", "RandomForest", "ExtraTrees"],
            "xai":       "SHAP TreeExplainer",
            "dataset":   "Z-Alizadeh Sani (Extended, N=303)",
        }
    }


@app.get("/health", tags=["Meta"])
async def health_check():
    """Returns system status and model registry readiness."""
    try:
        registry = get_registry()
        return {
            "status":         "healthy",
            "models_loaded":  list(registry.models.keys()),
            "features_count": len(registry.feature_columns),
            "shap_available": list(registry.shap_explainers.keys()),
            "timestamp":      datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model registry not ready: {str(e)}")


@app.post("/predict", tags=["Inference"])
async def predict(patient: PatientData):
    """
    Primary inference endpoint.
    
    Accepts clinical patient parameters and returns:
      - Overall CAD probability and risk tier
      - Vessel-specific stenosis (LAD, LCX, RCA) with probabilities
      - SHAP-derived top 10 risk driver attributions per target
      - Predicted number of affected coronary vessels
    """
    try:
        # Convert Pydantic model to dict, excluding None, applying field aliases
        patient_dict = patient.model_dump(by_alias=True, exclude_none=True)
        result = run_inference(patient_dict)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=422, detail=f"Inference failed: {str(e)}")


@app.post("/predict/batch", tags=["Inference"])
async def predict_batch(body: BatchPatientData):
    """Batch inference for multiple patients in a single API call."""
    results = []
    errors = []
    for i, patient in enumerate(body.patients):
        try:
            patient_dict = patient.model_dump(by_alias=True, exclude_none=True)
            result = run_inference(patient_dict)
            results.append({"patient_index": i, "success": True, "result": result})
        except Exception as e:
            errors.append({"patient_index": i, "success": False, "error": str(e)})

    return {
        "total":      len(body.patients),
        "successful": len(results),
        "failed":     len(errors),
        "results":    results,
        "errors":     errors,
    }


@app.get("/features", tags=["Meta"])
async def get_features():
    """Returns the 67-feature list with clinical display names and descriptions."""
    registry = get_registry()
    features = [
        {
            "index":        i,
            "feature":      col,
            "display_name": FEATURE_DISPLAY_NAMES.get(col, col),
            "engineered":   col not in [
                'Age', 'Weight', 'Length', 'Sex', 'BMI', 'DM', 'HTN',
                'Current Smoker', 'EX-Smoker', 'FH', 'Obesity', 'CRF', 'CVA',
                'Airway disease', 'Thyroid Disease', 'CHF', 'DLP', 'BP', 'PR',
                'Edema', 'Weak Peripheral Pulse', 'Lung rales', 'Systolic Murmur',
                'Diastolic Murmur', 'Typical Chest Pain', 'Dyspnea', 'Function Class',
                'Atypical', 'Nonanginal', 'Exertional CP', 'LowTH Ang', 'Q Wave',
                'St Elevation', 'St Depression', 'Tinversion', 'LVH', 'Poor R Progression',
                'BBB', 'FBS', 'CR', 'TG', 'LDL', 'HDL', 'BUN', 'ESR', 'HB', 'K', 'Na',
                'WBC', 'Lymph', 'Neut', 'PLT', 'EF-TTE', 'Region RWMA', 'VHD'
            ]
        }
        for i, col in enumerate(registry.feature_columns)
    ]
    return {
        "total_features": len(features),
        "raw_features":   sum(1 for f in features if not f["engineered"]),
        "engineered_features": sum(1 for f in features if f["engineered"]),
        "features": features
    }


@app.get("/metadata", tags=["Meta"])
async def get_metadata():
    """Returns full training pipeline metadata including CV benchmarks."""
    metadata_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "saved_models", "metadata.json"
    )
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Metadata file not found. Run training first.")
    with open(metadata_path) as f:
        metadata = json.load(f)
    return metadata


# ─── Run (Development) ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "model.api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=1,
        log_level="info",
    )
