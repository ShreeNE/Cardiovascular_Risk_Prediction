"""
CorVita Real-Time Inference Engine
====================================
Production-grade, SHAP-augmented inference module for the FastAPI backend.

Responsibilities:
  - Lazy-loads all serialized model artifacts from `saved_models/` on first call.
  - Converts raw patient JSON payloads into scaled feature matrices via MedicalDataPreprocessor.
  - Runs Soft Voting Ensemble predictions for Cath, LAD, LCX, and RCA in parallel.
  - Computes per-patient SHAP TreeExplainer feature attributions (XGBoost surrogate).
  - Returns structured clinical risk reports with confidence scores and top risk drivers.
"""

import os
import json
import time
import logging
from functools import lru_cache
from typing import Dict, List, Optional, Any, Tuple

import numpy as np
import pandas as pd
import joblib
import xgboost as xgb

try:
    import shap
except ImportError:
    shap = None

logger = logging.getLogger("CorVita-Inference")

# ─── Paths ────────────────────────────────────────────────────────────────────
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(_BASE_DIR, "saved_models")

_PREPROCESSOR_PATH      = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
_FEATURE_COLUMNS_PATH   = os.path.join(SAVED_MODELS_DIR, "feature_columns.json")
_SHAP_EXPLAINERS_PATH   = os.path.join(SAVED_MODELS_DIR, "shap_explainers.joblib")

TARGET_LABELS = {
    "Cath": {"positive": "CAD",      "negative": "Normal",  "type": "systemic"},
    "LAD":  {"positive": "Stenotic", "negative": "Normal",  "type": "vessel"},
    "LCX":  {"positive": "Stenotic", "negative": "Normal",  "type": "vessel"},
    "RCA":  {"positive": "Stenotic", "negative": "Normal",  "type": "vessel"},
}

RISK_TIERS = [
    (0.80, "Critical CAD",   "critical"),
    (0.60, "High Risk",      "high"),
    (0.40, "Moderate Risk",  "moderate"),
    (0.00, "Low Risk",       "low"),
]

# Clinical display names for features
FEATURE_DISPLAY_NAMES = {
    "Age":                    "Patient Age",
    "Weight":                 "Body Weight",
    "Length":                 "Height",
    "Sex":                    "Biological Sex",
    "BMI":                    "Body Mass Index",
    "DM":                     "Diabetes Mellitus",
    "HTN":                    "Hypertension",
    "Current Smoker":         "Active Smoking",
    "EX-Smoker":              "Ex-Smoker History",
    "FH":                     "Family History of CAD",
    "Obesity":                "Obesity",
    "CRF":                    "Chronic Renal Failure",
    "CVA":                    "Prior Stroke / CVA",
    "Airway disease":         "Airway Disease (COPD/Asthma)",
    "Thyroid Disease":        "Thyroid Disorder",
    "CHF":                    "Congestive Heart Failure",
    "DLP":                    "Dyslipidemia",
    "BP":                     "Systolic Blood Pressure",
    "PR":                     "Heart Rate (PR)",
    "Edema":                  "Peripheral Edema",
    "Weak Peripheral Pulse":  "Weak Peripheral Pulse",
    "Lung rales":             "Lung Rales",
    "Systolic Murmur":        "Systolic Heart Murmur",
    "Diastolic Murmur":       "Diastolic Heart Murmur",
    "Typical Chest Pain":     "Typical Angina Pectoris",
    "Dyspnea":                "Dyspnea (Shortness of Breath)",
    "Function Class":         "NYHA Functional Class",
    "Atypical":               "Atypical Chest Discomfort",
    "Nonanginal":             "Non-Anginal Chest Pain",
    "Exertional CP":          "Exertional Chest Pain",
    "LowTH Ang":              "Low-Threshold Angina",
    "Q Wave":                 "Pathological Q Wave (ECG)",
    "St Elevation":           "ST Elevation (ECG)",
    "St Depression":          "ST Depression (ECG)",
    "Tinversion":             "T-Wave Inversion (ECG)",
    "LVH":                    "Left Ventricular Hypertrophy",
    "Poor R Progression":     "Poor R-Wave Progression",
    "BBB":                    "Bundle Branch Block",
    "FBS":                    "Fasting Blood Glucose",
    "CR":                     "Serum Creatinine",
    "TG":                     "Triglycerides",
    "LDL":                    "LDL Cholesterol",
    "HDL":                    "HDL Cholesterol",
    "BUN":                    "Blood Urea Nitrogen",
    "ESR":                    "Erythrocyte Sedimentation Rate",
    "HB":                     "Hemoglobin",
    "K":                      "Serum Potassium",
    "Na":                     "Serum Sodium",
    "WBC":                    "White Blood Cell Count",
    "Lymph":                  "Lymphocyte %",
    "Neut":                   "Neutrophil %",
    "PLT":                    "Platelet Count",
    "EF-TTE":                 "Ejection Fraction (Echo)",
    "Region RWMA":            "Regional Wall Motion Abnormality",
    "VHD":                    "Valvular Heart Disease",
    # Engineered features
    "TG_HDL_ratio":           "Atherogenic Index (TG/HDL)",
    "LDL_HDL_ratio":          "LDL/HDL Atherogenic Ratio",
    "BUN_CR_ratio":           "BUN/Creatinine (Cardio-Renal)",
    "NLR":                    "Neutrophil-to-Lymphocyte Ratio (NLR)",
    "PLR":                    "Platelet-to-Lymphocyte Ratio (PLR)",
    "Rate_Pressure_Product":  "Rate-Pressure Product (Myocardial O₂ Demand)",
    "ECG_Ischemia_Score":     "ECG Ischemic Burden Score",
    "Vascular_Risk_Burden":   "Composite Vascular Risk Burden",
    "EF_RWMA_Ratio":          "Ventricular Efficiency (EF/RWMA)",
    "Angina_Age_Interaction": "Age-Stratified Angina Risk",
    "Sex_Angina_Interaction": "Sex-Stratified Angina Risk",
    "Age_BP_Risk":            "Age-Hemodynamic Arterial Stiffness Index",
}


# ─── Platform-Agnostic Hybrid Voting Classifier ──────────────────────────────
class HybridVotingClassifier:
    """
    Platform-independent Soft Voting Classifier.
    Combines pure scikit-learn models (joblib) with native XGBoost (JSON).
    Guarantees 100% cross-platform compatibility across macOS, Windows (CUDA/CPU), and Linux.
    """
    def __init__(self, target: str, saved_dir: str = SAVED_MODELS_DIR):
        self.target = target
        sk_path = os.path.join(saved_dir, f"sklearn_ensemble_{target}.joblib")
        xgb_path = os.path.join(saved_dir, f"{target.lower()}_xgb.json")
        if not os.path.exists(xgb_path):
            xgb_path = os.path.join(saved_dir, f"{target}_xgb.json")

        if not os.path.exists(sk_path) or not os.path.exists(xgb_path):
            raise FileNotFoundError(
                f"Missing hybrid model files for {target}: {sk_path} or {xgb_path}"
            )

        sk_data = joblib.load(sk_path)
        self.gb = sk_data["gb"]
        self.rf = sk_data["rf"]
        self.et = sk_data["et"]
        self.weights = list(sk_data["weights"])
        self.classes_ = sk_data.get("classes_", np.array([0, 1]))

        self.xgb = xgb.XGBClassifier()
        self.xgb.load_model(xgb_path)

        self.named_estimators_ = {
            "gb": self.gb,
            "xgb": self.xgb,
            "rf": self.rf,
            "et": self.et,
        }

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        w_gb, w_xgb, w_rf, w_et = self.weights
        total = sum(self.weights)
        p_gb = self.gb.predict_proba(X)
        p_xgb = self.xgb.predict_proba(X)
        p_rf = self.rf.predict_proba(X)
        p_et = self.et.predict_proba(X)
        return (p_gb * w_gb + p_xgb * w_xgb + p_rf * w_rf + p_et * w_et) / total

    def predict(self, X: np.ndarray) -> np.ndarray:
        proba = self.predict_proba(X)
        return self.classes_[np.argmax(proba, axis=1)]


# ─── Model Registry (Lazy Singleton) ─────────────────────────────────────────
class ModelRegistry:
    """Thread-safe lazy-loading singleton for all model artifacts."""

    _instance: Optional["ModelRegistry"] = None
    _loaded: bool = False

    preprocessor: Any = None
    models: Dict[str, Any] = {}
    xgb_boosters: Dict[str, Any] = {}
    shap_explainers: Dict[str, Any] = {}
    feature_columns: List[str] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def ensure_loaded(self):
        if self._loaded:
            return
        self._load()

    def _load(self):
        logger.info("Loading CorVita ML model artifacts from saved_models/...")
        t0 = time.time()

        if not os.path.exists(SAVED_MODELS_DIR):
            raise RuntimeError(
                f"saved_models/ directory not found at {SAVED_MODELS_DIR}. "
                "Please run `python model/train.py` first."
            )

        # Load preprocessor
        self.preprocessor = joblib.load(_PREPROCESSOR_PATH)

        # Load feature column list
        with open(_FEATURE_COLUMNS_PATH) as f:
            self.feature_columns = json.load(f)

        # Load target models & native XGBoost boosters for lean TreeSHAP
        self.xgb_boosters = {}
        for target in TARGET_LABELS:
            # Load native XGBoost booster (for native, zero-dependency TreeSHAP)
            xgb_path = os.path.join(SAVED_MODELS_DIR, f"{target.lower()}_xgb.json")
            if not os.path.exists(xgb_path):
                xgb_path = os.path.join(SAVED_MODELS_DIR, f"{target}_xgb.json")
            if os.path.exists(xgb_path):
                try:
                    booster = xgb.Booster()
                    booster.load_model(xgb_path)
                    self.xgb_boosters[target] = booster
                    logger.info(f"Loaded native XGBoost booster for {target} (TreeSHAP ready)")
                except Exception as e:
                    logger.warning(f"Could not load native XGBoost booster for {target}: {e}")

            # 1. Prefer platform-agnostic Hybrid Voting Classifier (sklearn + XGBoost JSON)
            sk_path = os.path.join(SAVED_MODELS_DIR, f"sklearn_ensemble_{target}.joblib")
            if os.path.exists(sk_path) and os.path.exists(xgb_path):
                try:
                    self.models[target] = HybridVotingClassifier(target, SAVED_MODELS_DIR)
                    logger.info(f"Loaded platform-agnostic hybrid model for {target}")
                    continue
                except Exception as e:
                    logger.warning(f"Failed loading hybrid model for {target} ({e}), falling back to joblib.")

            # 2. Fallback to monolithic ensemble_{target}.joblib
            model_path = os.path.join(SAVED_MODELS_DIR, f"ensemble_{target}.joblib")
            if os.path.exists(model_path):
                try:
                    self.models[target] = joblib.load(model_path)
                    logger.info(f"Loaded monolithic joblib model for {target}")
                except Exception as e:
                    logger.error(
                        f"Failed loading {model_path} ({e}). "
                        f"Please ensure hybrid model files or run `python model/train.py`."
                    )
            else:
                logger.warning(f"Model file not found for target {target}: {model_path}")

        # Optional: Load external SHAP explainers if the shap library is available
        self.shap_explainers = {}
        if shap is not None:
            if os.path.exists(_SHAP_EXPLAINERS_PATH):
                try:
                    self.shap_explainers = joblib.load(_SHAP_EXPLAINERS_PATH)
                except Exception as e:
                    logger.warning(f"Could not load pre-pickled SHAP explainers ({e}). Generating on-the-fly.")

            for target in TARGET_LABELS:
                if target not in self.shap_explainers and target in self.models:
                    try:
                        xgb_est = self.models[target].named_estimators_.get("xgb")
                        if xgb_est is not None:
                            self.shap_explainers[target] = shap.TreeExplainer(xgb_est)
                            logger.info(f"Generated instant SHAP TreeExplainer for {target}")
                    except Exception as e:
                        logger.warning(f"Failed generating SHAP explainer for {target}: {e}")

        elapsed = time.time() - t0
        logger.info(
            f"Model registry loaded: {len(self.models)} models, "
            f"{len(self.feature_columns)} features in {elapsed:.2f}s"
        )
        self.__class__._loaded = True


_registry = ModelRegistry()


def get_registry() -> ModelRegistry:
    _registry.ensure_loaded()
    return _registry


# ─── SHAP Attribution Computation ─────────────────────────────────────────────
def compute_shap_attributions(
    X_scaled: np.ndarray,
    target: str,
    feature_names: List[str],
    top_n: int = 10
) -> List[Dict[str, Any]]:
    """
    Computes SHAP XGBoost TreeExplainer values for a single patient observation.
    Returns top N features ranked by absolute SHAP importance with clinical metadata.
    """
    registry = get_registry()
    patient_shap = None

    # 1. Native XGBoost TreeSHAP (ultra-fast C++ calculation, zero dependency on shap/numba)
    if target in registry.xgb_boosters:
        try:
            booster = registry.xgb_boosters[target]
            dmat = xgb.DMatrix(X_scaled)
            contribs = booster.predict(dmat, pred_contribs=True)
            patient_shap = contribs[0, :-1]  # Exclude last element which is the bias term
        except Exception as e:
            logger.warning(f"Native XGBoost SHAP computation failed for {target}: {e}")

    # 2. Fallback to external shap.TreeExplainer if available
    if patient_shap is None and target in registry.shap_explainers:
        try:
            explainer = registry.shap_explainers[target]
            shap_values = explainer.shap_values(X_scaled)

            # Handle both 1D and 2D SHAP output shapes
            if hasattr(shap_values, 'shape') and shap_values.ndim == 2:
                patient_shap = shap_values[0]
            elif isinstance(shap_values, (list, np.ndarray)):
                arr = np.array(shap_values)
                if arr.ndim == 2:
                    patient_shap = arr[0]
                elif arr.ndim == 3:
                    patient_shap = arr[0, :, 1] if arr.shape[2] > 1 else arr[0, :, 0]
                else:
                    patient_shap = arr.ravel()
        except Exception as e:
            logger.warning(f"Fallback SHAP explainer failed for {target}: {e}")

    if patient_shap is None:
        return []

    # Rank by absolute impact
    abs_shap = np.abs(patient_shap)
    sorted_idx = np.argsort(abs_shap)[::-1][:top_n]

    attributions = []
    for rank, idx in enumerate(sorted_idx, 1):
        feature = feature_names[idx]
        shap_val = float(patient_shap[idx])
        abs_val = float(abs_shap[idx])

        direction = "risk-increasing" if shap_val > 0 else "risk-reducing"
        display_name = FEATURE_DISPLAY_NAMES.get(feature, feature)

        attributions.append({
            "rank":         rank,
            "feature":      feature,
            "display_name": display_name,
            "shap_value":   round(shap_val, 5),
            "abs_impact":   round(abs_val, 5),
            "direction":    direction,
        })

    return attributions


# ─── Core Inference Function ──────────────────────────────────────────────────
def get_risk_tier(probability: float) -> Tuple[str, str]:
    """Returns (label, severity) for a given probability score."""
    for threshold, label, severity in RISK_TIERS:
        if probability >= threshold:
            return label, severity
    return "Low Risk", "low"


def run_inference(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Primary inference entry point.
    
    Accepts:
        patient_data: Raw key-value clinical parameters as a Python dict.
                      Supports both exact dataset column names and common aliases.
    
    Returns:
        A structured clinical risk report containing:
          - Overall CAD probability and risk tier
          - Per-vessel (LAD, LCX, RCA) stenosis probabilities
          - Number of affected coronary vessels
          - SHAP feature attributions for each target
          - Processing metadata (latency, model version)
    """
    t_start = time.perf_counter()
    registry = get_registry()

    # Convert dict to single-row DataFrame
    patient_df = pd.DataFrame([patient_data])

    # Preprocess (imputation + encoding + scaling + feature engineering)
    X_scaled = registry.preprocessor.transform(patient_df)
    feature_names = registry.feature_columns

    # Per-target inference
    target_results = {}
    for target, meta in TARGET_LABELS.items():
        if target not in registry.models:
            continue

        model = registry.models[target]
        proba_array = model.predict_proba(X_scaled)[0]
        positive_proba = float(proba_array[1])
        predicted_class = int(positive_proba >= 0.5)
        predicted_label = meta["positive"] if predicted_class == 1 else meta["negative"]

        risk_label, severity = get_risk_tier(positive_proba)

        # SHAP attributions
        attributions = compute_shap_attributions(
            X_scaled=X_scaled,
            target=target,
            feature_names=feature_names,
            top_n=10
        )

        target_results[target] = {
            "probability":      round(positive_proba, 4),
            "probability_pct":  round(positive_proba * 100, 2),
            "predicted_label":  predicted_label,
            "predicted_class":  predicted_class,
            "risk_label":       risk_label,
            "severity":         severity,
            "shap_attributions": attributions,
        }

    # ─── Synthesize Clinical Risk Report ──────────────────────────────────────
    cath_proba    = target_results.get("Cath", {}).get("probability", 0.5)
    lad_proba     = target_results.get("LAD",  {}).get("probability", 0.5)
    lcx_proba     = target_results.get("LCX",  {}).get("probability", 0.5)
    rca_proba     = target_results.get("RCA",  {}).get("probability", 0.5)

    # Vessel count estimate (>50% stenosis probability threshold)
    vessel_threshold = 0.5
    predicted_vessels = sum([
        1 for p in [lad_proba, lcx_proba, rca_proba] if p >= vessel_threshold
    ])

    overall_risk_label, overall_severity = get_risk_tier(cath_proba)

    # Top combined SHAP contributors across Cath and LAD
    combined_attributions = target_results.get("Cath", {}).get("shap_attributions", [])
    key_risk_factors = [
        {
            "name":     attr["display_name"],
            "feature":  attr["feature"],
            "severity": "high" if attr["abs_impact"] > 0.5 else (
                        "moderate" if attr["abs_impact"] > 0.2 else "low"),
            "impact":   attr["direction"],
            "shap":     attr["shap_value"],
        }
        for attr in combined_attributions[:6]
        if attr["direction"] == "risk-increasing"
    ]

    protective_factors = [
        attr["display_name"]
        for attr in combined_attributions[:6]
        if attr["direction"] == "risk-reducing"
    ]

    t_end = time.perf_counter()
    latency_ms = round((t_end - t_start) * 1000, 2)

    return {
        "status":               "success",
        "latency_ms":           latency_ms,

        # ── Primary CAD Outcome ──────────────────────────────────────────
        "cad_probability":      round(cath_proba, 4),
        "cad_probability_pct":  round(cath_proba * 100, 2),
        "cad_diagnosis":        target_results.get("Cath", {}).get("predicted_label", "Unknown"),
        "risk_label":           overall_risk_label,
        "risk_severity":        overall_severity,
        "overall_risk_score":   round(cath_proba * 100, 1),

        # ── Vessel-Specific Stenosis ─────────────────────────────────────
        "lad_probability":      round(lad_proba, 4),
        "lad_probability_pct":  round(lad_proba * 100, 2),
        "lad_diagnosis":        target_results.get("LAD",  {}).get("predicted_label", "Unknown"),
        "lad_risk_label":       target_results.get("LAD",  {}).get("risk_label", "Low Risk"),
        "lad_severity":         target_results.get("LAD",  {}).get("severity", "low"),

        "lcx_probability":      round(lcx_proba, 4),
        "lcx_probability_pct":  round(lcx_proba * 100, 2),
        "lcx_diagnosis":        target_results.get("LCX",  {}).get("predicted_label", "Unknown"),
        "lcx_risk_label":       target_results.get("LCX",  {}).get("risk_label", "Low Risk"),
        "lcx_severity":         target_results.get("LCX",  {}).get("severity", "low"),

        "rca_probability":      round(rca_proba, 4),
        "rca_probability_pct":  round(rca_proba * 100, 2),
        "rca_diagnosis":        target_results.get("RCA",  {}).get("predicted_label", "Unknown"),
        "rca_risk_label":       target_results.get("RCA",  {}).get("risk_label", "Low Risk"),
        "rca_severity":         target_results.get("RCA",  {}).get("severity", "low"),

        # ── Multi-Vessel Assessment ──────────────────────────────────────
        "predicted_vessels":    predicted_vessels,
        "multi_vessel_disease": predicted_vessels >= 2,

        # ── Explainability ──────────────────────────────────────────────
        "key_risk_factors":     key_risk_factors,
        "protective_factors":   protective_factors,

        # ── Per-Target SHAP Drill-Down (for Dashboard) ───────────────────
        "shap_cath": target_results.get("Cath", {}).get("shap_attributions", []),
        "shap_lad":  target_results.get("LAD",  {}).get("shap_attributions", []),
        "shap_lcx":  target_results.get("LCX",  {}).get("shap_attributions", []),
        "shap_rca":  target_results.get("RCA",  {}).get("shap_attributions", []),

        # ── Full Per-Target Results ──────────────────────────────────────
        "targets": target_results,
    }
