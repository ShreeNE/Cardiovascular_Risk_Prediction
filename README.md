# CorVita // Intelligent Cardiovascular Risk & Coronary Assessment Suite

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Ensemble-FF6600?style=for-the-badge)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-blueviolet?style=for-the-badge)](https://shap.readthedocs.io/)

> **"Transforming clinical cardiovascular triage through leak-free ensemble machine learning, local SHAP explainability, and interactive medical-grade 3D coronary anatomy visualization."**

CorVita is a clinical-grade coronary artery disease (CAD) risk assessment simulator. It blends **rigorous biomedical machine learning** trained on the Z-Alizadeh Sani coronary dataset with a state-of-the-art, tactile clinical user interface designed for intuitive parameter adjustment, anatomical spatial orientation, and instant explainable triage.

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [User Interface & Clinical Aesthetics](#-user-interface--clinical-aesthetics)
- [Machine Learning Engine](#-machine-learning-engine)
  - [Anti-Leakage Protocol](#1-strict-anti-leakage-protocol)
  - [Engineered Clinical Biomarkers](#2-feature-engineering--clinical-biomarkers)
  - [Soft Voting Ensemble Architecture](#3-soft-voting-ensemble-architecture)
  - [5-Fold Stratified Cross-Validation Benchmarks](#4-5-fold-stratified-cross-validation-benchmarks)
  - [Explainable AI (SHAP TreeExplainer)](#5-explainable-ai-shap-treeexplainer)
- [Interactive 3D Heart & Coronary Tree](#-interactive-3d-heart--coronary-tree)
- [FastAPI Microservice Specification](#-fastapi-microservice-specification)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quickstart (Single Command)](#quickstart-recommended)
  - [Manual Setup (Step-by-Step)](#manual-setup)
- [Archetype Presets & Testing](#-archetype-presets--clinical-testing)
- [Troubleshooting](#-troubleshooting)
- [Medical & Ethical Disclaimer](#-medical--ethical-disclaimer)

---

## 🌟 Key Features

- **Multi-Target Coronary Diagnosis**: Concurrently predicts global CAD ($\ge 50\%$ stenosis on catheterization) as well as isolated vessel-specific stenosis in the **Left Anterior Descending (LAD)**, **Left Circumflex (LCX)**, and **Right Coronary Artery (RCA)**.
- **Leak-Free Machine Learning**: Trained on $N=303$ patients across 54 raw clinical parameters, engineered into 67 domain features with in-fold SMOTE and imputation.
- **Explainable AI (XAI)**: Generates real-time patient-level SHAP attributions separating *positive risk drivers* (e.g., ST depression, high RPP, diabetes) from *protective factors* (e.g., normal EF-TTE, high HDL).
- **Interactive 3D WebGL Visualization**: Built with Three.js, React Three Fiber, and GSAP. Features real-time risk-driven emissive vessel pulsing, smooth camera tweening, and anatomical reference toggles.
- **Doctor-Centric Tactile UI**: Minimalist slate/charcoal vignette (`#080B10`) with gold/brass accents, rapid category switching, precision tactile numeric steppers, calibrated continuous sliders, and real-time validation.
- **Fail-Safe Offline Hybrid**: Communicates directly with the FastAPI backend and automatically falls back to an internal heuristic inference engine if disconnected.

---

## 🏛 System Architecture

```
                                  [ Patient Clinical Inputs ]
                               (Demographics, Vitals, Labs, ECG)
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 + React 19 Frontend (Turbopack)                      │
│                                                                                        │
│  ┌─────────────────────────┐  ┌───────────────────────────┐  ┌──────────────────────┐  │
│  │ Clinical Nav & Steppers │  │ Three.js 3D Heart Canvas  │  │ Real-Time Risk HUD   │  │
│  │ Demographics | Vitals   │  │ Dynamic GLTF Meshes       │  │ Stenosis Probs       │  │
│  │ Labs | ECG & Echo       │  │ LAD / LCX / RCA Focus     │  │ SHAP Top Drivers     │  │
│  └────────────┬────────────┘  └─────────────▲─────────────┘  └──────────▲───────────┘  │
└───────────────┼─────────────────────────────┼───────────────────────────┼──────────────┘
                │ HTTP POST /predict (JSON)   │ Updates Vessel Materials  │
                ▼                             │ & Emissive Risk Shaders   │
┌─────────────────────────────────────────────┴───────────────────────────┴──────────────┐
│                              FastAPI Inference Microservice                            │
│                                                                                        │
│  1. Preprocessing Pipeline: Median / Mode Imputation & Robust Label Encoding          │
│  2. Feature Engineering: 14 Domain Biomarkers (AI, TG/HDL, RPP, NLR, PP, etc.)        │
│  3. Model Ensembles: Soft Voting [Gradient Boosting + XGBoost + RF + Extra Trees]     │
│  4. Local Explainability: SHAP TreeExplainer Local Attribution Computation             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 User Interface & Clinical Aesthetics

### 1. Modern Diagnostic UI Architecture
- **Atmospheric Palette**: Deep slate/charcoal vignette background (`#080B10`) accented with radiant amber/gold trim (`border-amber-400/80`, `text-amber-200`). Eliminates generic neon techno-babble in favor of a focused, professional clinical atmosphere.
- **Rapid Domain Navigation**:
  - Sequential tab switching with keyboard navigation support (`L1` / `R1` or arrow shortcuts) across clinical domains.
  - 4 distinct clinical categories:
    1. **Demographics** (`User`) &mdash; Age, Sex, Weight, Height, BMI.
    2. **Vitals & Symptoms** (`HeartPulse`) &mdash; Blood Pressure, Heart Rate, Angina presentation, Dyspnea.
    3. **Lab & Biomarkers** (`TestTube`) &mdash; FBS, Lipid Profile (LDL, HDL, TG), Inflammatory Markers (ESR, CRP).
    4. **ECG / Echo Findings** (`Activity`) &mdash; ST-segment shifts, T-wave inversion, Q-waves, EF-TTE, RWMA.
- **Asymmetric Split Layout**:
  - **Left Panel (~38% Width)**: Floating parameter configuration panel featuring smooth collapsible cards and archetype presets.
  - **Right Panel (~62% Width)**: Unobstructed, dedicated 3D anatomical viewer canvas with orbit controls and vessel inspection targets.

### 2. Precision Clinical Form Controls
- **`ClinicalStepperInput`**: Precision numeric input boxes (`bg-slate-900/60 border-slate-800 text-slate-100 focus:border-amber-500/60`) with tactile `+` / `-` buttons, direct typing, clinical reference ranges, and faint unit markers (`mmHg`, `mg/dL`, `bpm`).
- **`ContinuousOrnamentSlider`**: Minimal horizontal slider with gold indicator core, discreet tick pips, and calibration brackets (`<` and `>`).
- **`SegmentedToggle`**: Binary and categorical toggles with a soft brass highlight on active selection.

---

## 🧠 Machine Learning Engine

The ML engine (`model/`) is trained on the peer-reviewed **Z-Alizadeh Sani** coronary artery disease dataset ($N=303$ patients, 54 raw clinical attributes).

### 1. Strict Anti-Leakage Protocol
To preserve strict clinical validity and eliminate data leakage:
- **Catheterization Targets Excluded**: `Cath`, `LAD`, `LCX`, and `RCA` represent ground-truth coronary angiography outcomes and are **strictly segregated** from the feature matrix $X$.
- **Zero In-Fold Contamination**: Imputation, scaling, and SMOTE (Synthetic Minority Over-sampling Technique) are computed **strictly inside each training fold** during cross-validation, guaranteeing no validation data leaks into the training pipeline.

### 2. Feature Engineering & Clinical Biomarkers
In addition to 53 processed clinical features, 14 domain-validated cardiovascular biomarkers are engineered in `model/preprocessing.py`:

| Biomarker | Formula / Definition | Clinical Utility |
|:---|:---|:---|
| **Atherogenic Index (AI)** | $\text{LDL} / \text{HDL}$ | Primary predictor of circulating atherogenic particles |
| **Triglyceride-to-HDL Ratio** | $\text{TG} / \text{HDL}$ | Surrogate marker for small dense LDL & insulin resistance |
| **Rate-Pressure Product (RPP)** | $\frac{\text{Systolic BP} \times \text{Pulse Rate}}{100}$ | Quantifies myocardial workload and oxygen demand |
| **Pulse Pressure (PP)** | $\text{SBP} - \text{DBP}$ | Hemodynamic surrogate for large artery stiffness |
| **Neutrophil-to-Lymphocyte Ratio (NLR)** | $\text{Neutrophils} / \text{Lymphocytes}$ | Subclinical systemic vascular inflammation marker |
| **Platelet-to-Lymphocyte Ratio (PLR)** | $\text{Platelets} / \text{Lymphocytes}$ | Pro-thrombotic and platelet activation indicator |
| **Ventricular Efficiency Ratio** | $\frac{\text{EF-TTE}}{\text{Regional RWMA} + 1}$ | Left ventricular contractile efficiency adjusted for regional wall motion abnormality |
| **Composite Vascular Burden** | $\sum (\text{HTN}, \text{DM}, \text{Smoking}, \text{DLP}, \text{FH})$ | Cumulative lifestyle and hereditary vascular risk score |
| **ECG Ischemic Burden Score** | $\sum (\text{ST-Dep}, \text{ST-Elev}, \text{T-Inv}, \text{Q-Wave})$ | Composite electrophysiological ischemic stress index |
| **Age-Stratified Angina Interaction** | $\text{Typical Angina} \times \left(\frac{\text{Age}}{50}\right)$ | Weights classic symptomatic presentation by age-adjusted pre-test probability |

### 3. Soft Voting Ensemble Architecture
Because coronary artery disease involves heterogeneous clinical pathways across different vessels, a calibrated **Soft Voting Ensemble Classifier** is trained independently for each target:

$$P(y = 1 \mid \mathbf{x}) = \sum_{m=1}^{M} w_m P_m(y = 1 \mid \mathbf{x}), \quad \sum_{m=1}^{M} w_m = 1$$

The ensemble integrates:
1. **Gradient Boosting Classifier**: `n_estimators=200`, `learning_rate=0.03`, `max_depth=4`
2. **XGBoost Classifier**: `n_estimators=200`, `learning_rate=0.03`, `subsample=0.85`
3. **Random Forest Classifier**: `n_estimators=300`, `max_depth=6`, `min_samples_split=4`
4. **Extra Trees Classifier**: `n_estimators=300`, `max_depth=7`, randomized split thresholds

### 4. 5-Fold Stratified Cross-Validation Benchmarks

Verified results from `model/saved_models/metadata.json`:

| Target | Clinical Outcome | Overall Accuracy | Precision | Recall | F1-Score | Mean ROC-AUC | Top Fold ROC-AUC |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Cath** | Global CAD ($\ge 50\%$ Stenosis) | **87.13%** | **89.33%** | **93.06%** | **0.912** | **0.920** | **95.86%** |
| **LAD** | Left Anterior Descending Artery | **76.90%** | **80.23%** | **80.23%** | **0.802** | **0.850** | **93.30%** |
| **LCX** | Left Circumflex Artery | **67.99%** | **59.32%** | **58.82%** | **0.591** | **0.740** | **85.36%** |
| **RCA** | Right Coronary Artery | **67.66%** | **57.55%** | **53.51%** | **0.555** | **0.724** | **79.17%** |

### 5. Explainable AI (SHAP TreeExplainer)
For every inference request, the pipeline evaluates exact feature attributions using Shapley values:

$$\phi_i(\mathbf{x}) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \Big[ f_{\mathbf{x}}(S \cup \{i\}) - f_{\mathbf{x}}(S) \Big]$$

- **Positive Risk Drivers**: Factors actively increasing stenosis risk (e.g., Typical Angina, ST Depression, Diabetes, Elevated RPP).
- **Protective Factors**: Factors mitigating patient risk (e.g., Preserved EF-TTE, high HDL, absent RWMA).
- Attributions are returned directly in the REST API payload and rendered in the frontend risk inspection panel.

---

## 🫀 Interactive 3D Heart & Coronary Tree

CorVita features an interactive WebGL anatomical canvas built with `@react-three/fiber` and `@react-three/drei`:

- **Dual-Model Support**: Preloads both cardiac anatomy (`heart.glb`) and torso frame (`torso.glb`) for spatial reference.
- **Vessel-Specific Camera Transitions**: Clicking on **LAD**, **LCX**, or **RCA** initiates a GSAP camera tween to the exact anatomical coordinates of that vessel's perfusion territory:
  - **LAD**: Anterior interventricular sulcus (Apex, Anterior wall, Septum).
  - **LCX**: Left atrioventricular groove (Lateral, Posterior LV wall).
  - **RCA**: Right coronary sulcus (Inferior wall, Right ventricle).
- **Dynamic Emissive Shaders**: Vessels dynamically adjust color and pulse frequency based on predicted stenosis probability:
  - Normal / Low Risk ($< 35\%$): Subtle emerald glow (`#10b981`).
  - Moderate Risk ($35\% - 65\%$): Warm amber warning (`#f59e0b`).
  - High Stenosis ($\ge 65\%$): Pulsing crimson alert (`#ef4444`).
- **Interactive Orbit & Lighting**: Three-point studio lighting, contact shadows, and orbit controls with constrained zoom boundaries.

---

## ⚡ FastAPI Microservice Specification

The backend runs on **FastAPI** (`model/api.py`), serving inference on port `8000`:

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/` | API service metadata and route directory |
| `GET` | `/health` | System health, model registry status, and SHAP readiness |
| `GET` | `/features` | Returns the complete 67-feature schema with clinical display names |
| `GET` | `/metadata` | Detailed 5-fold cross-validation metrics, confusion matrices, and pipeline configuration |
| `POST` | `/predict` | Real-time single patient prediction with SHAP explanations |
| `POST` | `/predict/batch` | High-throughput batch patient predictions |
| `GET` | `/docs` | Interactive Swagger UI API documentation |

### Sample Inference Request

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "Age": 63,
    "Sex": "Male",
    "Weight": 84,
    "Length": 175,
    "BMI": 27.4,
    "BP": 160,
    "PR": 98,
    "HTN": 1,
    "DM": 0,
    "Current Smoker": 1,
    "Typical Chest Pain": 1,
    "St Depression": 1,
    "EF-TTE": 35,
    "Region RWMA": 3,
    "FBS": 183,
    "LDL": 168,
    "HDL": 32,
    "TG": 280
  }'
```

### Sample Response Snippet

```json
{
  "status": "success",
  "latency_ms": 38.4,
  "cad_probability_pct": 92.4,
  "cad_diagnosis": "High Risk / CAD Stenosis",
  "overall_risk_score": 92,
  "lad_probability_pct": 86.1,
  "lad_diagnosis": "Stenotic",
  "lcx_probability_pct": 68.3,
  "lcx_diagnosis": "Stenotic",
  "rca_probability_pct": 54.2,
  "rca_diagnosis": "Borderline / Intermediate",
  "predicted_vessels": 3,
  "multi_vessel_disease": true,
  "shap_attributions": [
    {"feature": "Typical Chest Pain", "direction": "risk-increasing", "abs_impact": 0.42},
    {"feature": "EF-TTE", "direction": "risk-increasing", "abs_impact": 0.38},
    {"feature": "St Depression", "direction": "risk-increasing", "abs_impact": 0.31}
  ]
}
```

---

## 📁 Project Directory Structure

```
cardiovascular project/
├── run_server.py                      # Root launcher forwarding to model/run_server.py
├── Cardiovascular_Risk_Prediction/
│   ├── README.md                      # Primary project documentation (this file)
│   ├── model/                         # Python ML & FastAPI Microservice
│   │   ├── __init__.py
│   │   ├── api.py                     # FastAPI REST API endpoints
│   │   ├── inference.py               # Model registry, inference logic & SHAP extraction
│   │   ├── preprocessing.py           # Feature engineering, imputation & encoding
│   │   ├── train.py                   # 5-fold CV training pipeline with SMOTE
│   │   ├── run_server.py              # Backend Uvicorn launcher
│   │   ├── requirements.txt           # Python dependency specifications
│   │   ├── data/                      # Z-Alizadeh Sani dataset (xlsx / csv)
│   │   └── saved_models/              # Serialized joblib models, JSON trees & metadata
│   │       ├── ensemble_Cath.joblib
│   │       ├── ensemble_LAD.joblib
│   │       ├── ensemble_LCX.joblib
│   │       ├── ensemble_RCA.joblib
│   │       ├── preprocessor.joblib
│   │       ├── shap_explainers.joblib
│   │       └── metadata.json
│   │
│   └── frontend/                      # Next.js 16 Web Application
│       ├── package.json               # Node dependencies (@react-three/fiber, drei, etc.)
│       ├── next.config.ts             # Next.js & Turbopack configuration
│       ├── tsconfig.json              # TypeScript configuration
│       ├── public/
│       │   └── assets/                # 3D Assets (heart.glb, torso.glb)
│       └── src/
│           ├── app/
│           │   ├── layout.tsx         # Root HTML layout & fonts
│           │   └── page.tsx           # Main application state & split layout
│           ├── components/
│           │   ├── HeartCanvas3D.tsx  # Three.js 3D cardiac viewer & vessel highlighting
│           │   ├── CleanParameterPanel.tsx # Parameter input cards (Demographics, Vitals, etc.)
│           │   ├── HogwartsHeaderNav.tsx   # Domain navigation bar & quick-switch header
│           │   ├── PredictionInlinePanel.tsx # Real-time risk HUD & SHAP breakdown
│           │   ├── DisclaimerModal.tsx     # Mandatory clinical disclaimer modal
│           │   └── ui/                # Core UI primitives
│           ├── data/
│           │   └── patientArchetypes.ts # 4 Clinical archetype presets
│           ├── types/
│           │   └── medical.ts         # TypeScript interfaces for patients & predictions
│           └── utils/
│               └── cadPredictor.ts    # API client with automatic offline fallback
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm**: v9+
- **Python**: v3.10 or v3.11
- **Hardware Acceleration**: A WebGL-enabled browser (Chrome, Edge, Firefox, Brave)

---

### Quickstart (Recommended)

#### Step 1: Start the ML Backend Server
From the project root:
```bash
python run_server.py
```
*The ML API will start on [http://localhost:8000](http://localhost:8000) with interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs).*

#### Step 2: Start the Next.js Frontend
In a new terminal window:
```bash
cd Cardiovascular_Risk_Prediction/frontend
npm install
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

### Manual Setup

#### 1. Backend Setup
```bash
cd Cardiovascular_Risk_Prediction/model

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server with hot reload
python run_server.py --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd Cardiovascular_Risk_Prediction/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 3. Building for Production
```bash
cd Cardiovascular_Risk_Prediction/frontend
npm run build
npm run start
```

---

## 🧪 Archetype Presets & Clinical Testing

The simulator includes 4 pre-configured clinical archetypes accessible via the preset selector:

1. **Healthy Control Athlete (`healthy-control`)**:
   - 54-year-old male, BP 125/72, normal lipids, preserved EF ($60\%$), no regional wall abnormalities.
   - *Expected Outcome*: Overall CAD risk $< 15\%$, all coronary vessels clean. Triggers confetti milestone.
2. **Acute STEMI Crisis (`stemi-crisis`)**:
   - 63-year-old male smoker with crushing typical chest pain, marked ST elevations (V1-V4), EF $35\%$, RWMA 3.
   - *Expected Outcome*: Critical overall CAD risk ($> 90\%$), severe proximal LAD stenosis.
3. **Diabetic Triple-Vessel Disease (`diabetic-tvd`)**:
   - 70-year-old female with long-standing diabetes (FBS 235), diffuse calcification, ST depression, high RPP.
   - *Expected Outcome*: High risk across all three coronary vessels (LAD, LCX, RCA).
4. **Metabolic & Dyslipidemia (`borderline-dyslipidemia`)**:
   - 52-year-old sedentary male with elevated LDL/HDL ratio, borderline hypertension (138/85), and early T-wave changes.
   - *Expected Outcome*: Intermediate risk ($45\% - 55\%$) demonstrating nuanced SHAP attribution tradeoffs.

---

## 🛠 Troubleshooting

### 1. `Module not found: Can't resolve '@react-three/drei'`
This indicates that `@react-three/drei` or companion WebGL libraries have not been installed in `frontend/node_modules`.  
**Resolution**:
```bash
cd Cardiovascular_Risk_Prediction/frontend
npm install
```

### 2. Frontend Shows `ML Engine: Offline`
The frontend will continue operating using internal heuristic calculations, but the ML backend is unreachable.  
**Resolution**:
- Confirm that the FastAPI server is running on port `8000`.
- Verify [http://localhost:8000/health](http://localhost:8000/health) in your browser.
- If using a custom port, set `NEXT_PUBLIC_API_URL=http://localhost:<PORT>` in `frontend/.env.local`.

### 3. Three.js / WebGL Blank Screen
- Ensure hardware acceleration is enabled in your browser settings (**Settings** $\rightarrow$ **System** $\rightarrow$ **Use graphics acceleration when available**).
- Confirm that `heart.glb` and `torso.glb` exist in `frontend/public/assets/`.

---

## ⚖️ Medical & Ethical Disclaimer

> [!WARNING]
> **EDUCATIONAL & RESEARCH USE ONLY**:  
> CorVita is developed exclusively for educational, academic, and research demonstration purposes. The risk scores, stenosis classifications, and SHAP attributions generated by this system are statistical approximations derived from machine learning models trained on retrospective data ($N=303$).  
> 
> This tool **does NOT constitute medical advice, clinical diagnosis, or treatment recommendations**. Healthcare providers must exercise independent clinical judgment, and patients should always consult a licensed cardiologist or qualified medical professional regarding any health conditions or diagnostic procedures.

---

## 📄 License
This project is licensed under the MIT License &mdash; see the LICENSE file for details.

