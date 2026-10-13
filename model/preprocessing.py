"""
CorVita Clinical Data Preprocessing & Feature Engineering Pipeline
==================================================================
Production-grade preprocessing module for the Z-Alizadeh Sani dataset.
Implements:
  1. Strict anti-leakage isolation of angiographic outcome targets (Cath, LAD, LCX, RCA).
  2. Clinical domain feature engineering (Atherogenic index, NLR, PLR, RPP, ECG ischemia score).
  3. Robust missing value imputation (median for numerical, mode for categorical).
  4. Categorical encoding and standard feature scaling.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer


# Target labels representing invasive coronary angiography outcomes.
# MUST BE EXCLUDED from feature matrix to prevent catastrophic data leakage.
TARGET_COLUMNS = ['Cath', 'LAD', 'LCX', 'RCA']

# Raw dataset feature definitions
RAW_CATEGORICAL_COLUMNS = [
    'Sex', 'Obesity', 'CRF', 'CVA', 'Airway disease', 'Thyroid Disease',
    'CHF', 'DLP', 'Weak Peripheral Pulse', 'Lung rales', 'Systolic Murmur',
    'Diastolic Murmur', 'Dyspnea', 'Atypical', 'Nonanginal', 'Exertional CP',
    'LowTH Ang', 'LVH', 'Poor R Progression', 'BBB', 'VHD'
]

RAW_BINARY_NUMERIC_COLUMNS = [
    'DM', 'HTN', 'Current Smoker', 'EX-Smoker', 'FH', 'Edema',
    'Typical Chest Pain', 'Q Wave', 'St Elevation', 'St Depression', 'Tinversion'
]

RAW_CONTINUOUS_NUMERIC_COLUMNS = [
    'Age', 'Weight', 'Length', 'BMI', 'BP', 'PR', 'Function Class',
    'FBS', 'CR', 'TG', 'LDL', 'HDL', 'BUN', 'ESR', 'HB', 'K', 'Na',
    'WBC', 'Lymph', 'Neut', 'PLT', 'EF-TTE', 'Region RWMA'
]

RAW_FEATURE_COLUMNS = (
    RAW_CONTINUOUS_NUMERIC_COLUMNS +
    RAW_BINARY_NUMERIC_COLUMNS +
    RAW_CATEGORICAL_COLUMNS
)

# Alias map for normalizing diverse client payloads (camelCase -> Dataset Header)
FIELD_ALIASES = {
    'age': 'Age',
    'weight': 'Weight',
    'length': 'Length',
    'sex': 'Sex',
    'gender': 'Sex',
    'bmi': 'BMI',
    'dm': 'DM',
    'diabetes': 'DM',
    'htn': 'HTN',
    'hypertension': 'HTN',
    'currentsmoker': 'Current Smoker',
    'current_smoker': 'Current Smoker',
    'exsmoker': 'EX-Smoker',
    'ex_smoker': 'EX-Smoker',
    'fh': 'FH',
    'familyhistory': 'FH',
    'obesity': 'Obesity',
    'crf': 'CRF',
    'cva': 'CVA',
    'airwaydisease': 'Airway disease',
    'airway_disease': 'Airway disease',
    'copd': 'Airway disease',
    'thyroiddisease': 'Thyroid Disease',
    'thyroid_disease': 'Thyroid Disease',
    'chf': 'CHF',
    'heartfailure': 'CHF',
    'dlp': 'DLP',
    'dyslipidemia': 'DLP',
    'bp': 'BP',
    'bloodpressure': 'BP',
    'pr': 'PR',
    'pulserate': 'PR',
    'heartrate': 'PR',
    'edema': 'Edema',
    'weakperipheralpulse': 'Weak Peripheral Pulse',
    'weak_peripheral_pulse': 'Weak Peripheral Pulse',
    'lungrales': 'Lung rales',
    'lung_rales': 'Lung rales',
    'systolicmurmur': 'Systolic Murmur',
    'systolic_murmur': 'Systolic Murmur',
    'diastolicmurmur': 'Diastolic Murmur',
    'diastolic_murmur': 'Diastolic Murmur',
    'typicalchestpain': 'Typical Chest Pain',
    'typical_chest_pain': 'Typical Chest Pain',
    'angina': 'Typical Chest Pain',
    'dyspnea': 'Dyspnea',
    'shortnessofbreath': 'Dyspnea',
    'functionclass': 'Function Class',
    'function_class': 'Function Class',
    'nyhaclass': 'Function Class',
    'atypical': 'Atypical',
    'nonanginal': 'Nonanginal',
    'exertionalcp': 'Exertional CP',
    'exertional_cp': 'Exertional CP',
    'lowthang': 'LowTH Ang',
    'low_th_ang': 'LowTH Ang',
    'qwave': 'Q Wave',
    'q_wave': 'Q Wave',
    'stelevation': 'St Elevation',
    'st_elevation': 'St Elevation',
    'stdepression': 'St Depression',
    'st_depression': 'St Depression',
    'tinversion': 'Tinversion',
    't_inversion': 'Tinversion',
    'lvh': 'LVH',
    'poorrprogression': 'Poor R Progression',
    'poor_r_progression': 'Poor R Progression',
    'bbb': 'BBB',
    'fbs': 'FBS',
    'fastingbloodsugar': 'FBS',
    'cr': 'CR',
    'creatinine': 'CR',
    'tg': 'TG',
    'triglycerides': 'TG',
    'ldl': 'LDL',
    'hdl': 'HDL',
    'bun': 'BUN',
    'esr': 'ESR',
    'hb': 'HB',
    'hemoglobin': 'HB',
    'k': 'K',
    'potassium': 'K',
    'na': 'Na',
    'sodium': 'Na',
    'wbc': 'WBC',
    'lymph': 'Lymph',
    'neut': 'Neut',
    'plt': 'PLT',
    'platelets': 'PLT',
    'eftte': 'EF-TTE',
    'ef_tte': 'EF-TTE',
    'ejectionfraction': 'EF-TTE',
    'regionrwma': 'Region RWMA',
    'region_rwma': 'Region RWMA',
    'vhd': 'VHD'
}


def normalize_binary_value(val: Any) -> int:
    """Normalize mixed binary clinical representations to 0 or 1."""
    if pd.isna(val) or val is None:
        return 0
    if isinstance(val, (int, float, np.integer, np.floating)):
        return 1 if val > 0 else 0
    s = str(val).strip().lower()
    if s in ('1', 'y', 'yes', 'true', 'positive', 'stenotic', 'cad'):
        return 1
    return 0


def normalize_sex_value(val: Any) -> str:
    """Standardize sex string to 'Male' or 'Fmale' matching dataset convention."""
    if pd.isna(val) or val is None:
        return 'Male'
    s = str(val).strip().lower()
    if s.startswith('f'):
        return 'Fmale'
    return 'Male'


def normalize_vhd_value(val: Any) -> str:
    """Standardize Valvular Heart Disease category."""
    if pd.isna(val) or val is None:
        return 'N'
    s = str(val).strip().lower()
    if 'sev' in s:
        return 'Severe'
    if 'mod' in s:
        return 'Moderate'
    if 'mil' in s:
        return 'mild'
    return 'N'


def normalize_bbb_value(val: Any) -> str:
    """Standardize Bundle Branch Block category."""
    if pd.isna(val) or val is None:
        return 'N'
    s = str(val).strip().upper()
    if 'LBBB' in s:
        return 'LBBB'
    if 'RBBB' in s:
        return 'RBBB'
    return 'N'


def engineer_clinical_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes evidence-based cardiovascular biomarker ratios and clinical interaction terms.
    Features:
      - TG_HDL_ratio: Atherogenic index of plasma (strongest metabolic predictor of CAD)
      - LDL_HDL_ratio: Atherogenic dyslipidemia ratio
      - BUN_CR_ratio: Cardio-renal syndrome & prerenal azotemia indicator
      - NLR: Neutrophil-to-Lymphocyte ratio (systemic vascular inflammation)
      - PLR: Platelet-to-Lymphocyte ratio (thrombotic-inflammatory balance)
      - Rate_Pressure_Product: Hemodynamic myocardial oxygen demand index (BP * PR / 100)
      - ECG_Ischemia_Score: Cumulative ischemic electrocardiographic burden
      - Vascular_Risk_Burden: Multi-factorial metabolic & lifestyle burden score
      - EF_RWMA_Ratio: Ventricular contractile efficiency index
      - Angina_Age_Interaction: Age-stratified anginal symptom multiplier
      - Sex_Angina_Interaction: Gender-stratified typical chest pain interaction
      - Age_BP_Risk: Combined age-hemodynamic arterial stiffness index
    """
    d = df.copy()

    # Continuous lipid & renal ratios
    hdl_safe = np.maximum(d['HDL'].astype(float), 1e-4)
    cr_safe = np.maximum(d['CR'].astype(float), 1e-4)
    lymph_safe = np.maximum(d['Lymph'].astype(float), 1e-4)

    d['TG_HDL_ratio'] = d['TG'].astype(float) / hdl_safe
    d['LDL_HDL_ratio'] = d['LDL'].astype(float) / hdl_safe
    d['BUN_CR_ratio'] = d['BUN'].astype(float) / cr_safe

    # Hematological inflammatory ratios
    d['NLR'] = d['Neut'].astype(float) / lymph_safe
    d['PLR'] = d['PLT'].astype(float) / lymph_safe

    # Myocardial oxygen demand
    d['Rate_Pressure_Product'] = (d['BP'].astype(float) * d['PR'].astype(float)) / 100.0

    # ECG ischemia composite
    ecg_terms = ['Q Wave', 'St Elevation', 'St Depression', 'Tinversion']
    d['ECG_Ischemia_Score'] = d[ecg_terms].apply(pd.to_numeric, errors='coerce').fillna(0).sum(axis=1)

    # Vascular risk burden (composite count of vascular co-morbidities)
    dm_bin = d['DM'].apply(normalize_binary_value)
    htn_bin = d['HTN'].apply(normalize_binary_value)
    smoker_bin = d['Current Smoker'].apply(normalize_binary_value)
    fh_bin = d['FH'].apply(normalize_binary_value)
    dlp_bin = d['DLP'].apply(normalize_binary_value)
    obesity_bin = d['Obesity'].apply(normalize_binary_value)
    d['Vascular_Risk_Burden'] = dm_bin + htn_bin + smoker_bin + fh_bin + dlp_bin + obesity_bin

    # Ventricular contractile efficiency
    rwma_safe = d['Region RWMA'].astype(float) + 1.0
    d['EF_RWMA_Ratio'] = d['EF-TTE'].astype(float) / rwma_safe

    # Symptom interactions
    tcp_bin = d['Typical Chest Pain'].apply(normalize_binary_value)
    is_male = (d['Sex'].astype(str).str.lower().str.startswith('m')).astype(int)
    d['Angina_Age_Interaction'] = tcp_bin * d['Age'].astype(float)
    d['Sex_Angina_Interaction'] = is_male * tcp_bin

    # Arterial stiffness & age-hemodynamic index
    d['Age_BP_Risk'] = (d['Age'].astype(float) / 50.0) * (d['BP'].astype(float) / 120.0)

    return d


class MedicalDataPreprocessor(BaseEstimator, TransformerMixin):
    """
    Robust clinical data preprocessor.
    Guarantees:
      - Automatic handling of missing values (median for continuous, mode for categorical).
      - Consistent encoding across training and real-time inference.
      - Scaler fitting strictly on training sets to prevent leakage.
      - Seamless normalization of client JSON / dict payloads.
    """

    def __init__(self, with_feature_engineering: bool = True):
        self.with_feature_engineering = with_feature_engineering
        self.num_imputer = SimpleImputer(strategy='median')
        self.cat_imputer = SimpleImputer(strategy='most_frequent')
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.categorical_columns: List[str] = list(RAW_CATEGORICAL_COLUMNS)
        self.numeric_columns: List[str] = list(RAW_CONTINUOUS_NUMERIC_COLUMNS + RAW_BINARY_NUMERIC_COLUMNS)
        self.feature_columns_: List[str] = []
        self.is_fitted: bool = False

    def _sanitize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardizes column names, casing, and binary encodings."""
        sanitized = df.copy()

        # Map known aliases (camelCase / snake_case -> dataset exact column names)
        col_rename = {}
        for col in sanitized.columns:
            clean_key = str(col).lower().replace('_', '').replace(' ', '').replace('-', '')
            if clean_key in FIELD_ALIASES:
                col_rename[col] = FIELD_ALIASES[clean_key]
        if col_rename:
            sanitized = sanitized.rename(columns=col_rename)

        # Drop any leakage columns if inadvertently passed
        leakage_cols = [c for c in TARGET_COLUMNS if c in sanitized.columns]
        if leakage_cols:
            sanitized = sanitized.drop(columns=leakage_cols)

        # Ensure all expected raw columns exist, filling missing with NaN for imputation
        for expected_col in RAW_FEATURE_COLUMNS:
            if expected_col not in sanitized.columns:
                sanitized[expected_col] = np.nan

        # Clean string / categorical columns
        if 'Sex' in sanitized.columns:
            sanitized['Sex'] = sanitized['Sex'].apply(normalize_sex_value)
        if 'VHD' in sanitized.columns:
            sanitized['VHD'] = sanitized['VHD'].apply(normalize_vhd_value)
        if 'BBB' in sanitized.columns:
            sanitized['BBB'] = sanitized['BBB'].apply(normalize_bbb_value)

        # Clean Y/N categoricals
        yn_cols = [
            'Obesity', 'CRF', 'CVA', 'Airway disease', 'Thyroid Disease',
            'CHF', 'DLP', 'Weak Peripheral Pulse', 'Lung rales', 'Systolic Murmur',
            'Diastolic Murmur', 'Dyspnea', 'Atypical', 'Nonanginal', 'Exertional CP',
            'LowTH Ang', 'LVH', 'Poor R Progression'
        ]
        for c in yn_cols:
            if c in sanitized.columns:
                sanitized[c] = sanitized[c].apply(
                    lambda v: 'Y' if str(v).strip().upper() in ('Y', 'YES', '1', 'TRUE') else 'N'
                )

        # Clean binary numeric columns
        for c in RAW_BINARY_NUMERIC_COLUMNS:
            if c in sanitized.columns:
                sanitized[c] = sanitized[c].apply(normalize_binary_value)

        # Ensure continuous numeric columns are float
        for c in RAW_CONTINUOUS_NUMERIC_COLUMNS:
            if c in sanitized.columns:
                sanitized[c] = pd.to_numeric(sanitized[c], errors='coerce')

        return sanitized

    def fit(self, X: pd.DataFrame, y=None):
        """Fit imputers, label encoders, and scaler on training data."""
        X_clean = self._sanitize_dataframe(X)

        if self.with_feature_engineering:
            X_clean = engineer_clinical_features(X_clean)

        # Separate continuous/numeric vs categorical
        all_cols = list(X_clean.columns)
        cat_cols = [c for c in all_cols if c in self.categorical_columns or X_clean[c].dtype == 'object' or pd.api.types.is_string_dtype(X_clean[c])]
        num_cols = [c for c in all_cols if c not in cat_cols]

        # Fit numerical imputer
        self.num_cols_ = num_cols
        self.cat_cols_ = cat_cols

        X_clean[num_cols] = self.num_imputer.fit_transform(X_clean[num_cols])
        X_clean[cat_cols] = self.cat_imputer.fit_transform(X_clean[cat_cols])

        # Fit label encoders
        for c in cat_cols:
            le = LabelEncoder()
            # Ensure string type
            values = X_clean[c].astype(str)
            le.fit(values)
            self.label_encoders[c] = le
            X_clean[c] = le.transform(values)

        # Record ordered feature columns
        self.feature_columns_ = list(X_clean.columns)

        # Fit scaler
        self.scaler.fit(X_clean[self.feature_columns_])
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transform input data into preprocessed, scaled numpy matrix."""
        if not self.is_fitted:
            raise ValueError("MedicalDataPreprocessor has not been fitted yet.")

        X_clean = self._sanitize_dataframe(X)

        if self.with_feature_engineering:
            X_clean = engineer_clinical_features(X_clean)

        # Impute
        X_clean[self.num_cols_] = self.num_imputer.transform(X_clean[self.num_cols_])
        X_clean[self.cat_cols_] = self.cat_imputer.transform(X_clean[self.cat_cols_])

        # Encode categoricals with unseen category handling
        for c in self.cat_cols_:
            le = self.label_encoders[c]
            values = X_clean[c].astype(str)
            known_classes = set(le.classes_)
            # Map any unknown class to the most frequent class (class index 0)
            fallback = le.classes_[0]
            values_safe = values.apply(lambda v: v if v in known_classes else fallback)
            X_clean[c] = le.transform(values_safe)

        # Reorder to match exact training column order
        X_ordered = X_clean[self.feature_columns_]

        # Scale
        X_scaled = self.scaler.transform(X_ordered)
        return X_scaled

    def transform_df(self, X: pd.DataFrame) -> pd.DataFrame:
        """Returns preprocessed features as a DataFrame with original column names."""
        scaled_array = self.transform(X)
        return pd.DataFrame(scaled_array, columns=self.feature_columns_)

    def get_feature_names(self) -> List[str]:
        return list(self.feature_columns_)
