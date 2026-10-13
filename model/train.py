"""
CorVita Machine Learning Training Pipeline
===========================================
Production-grade training script for CAD and vessel-specific stenosis prediction
using the Z-Alizadeh Sani extended dataset.

Targets:
  - Cath: Overall Coronary Artery Disease diagnosis ('CAD' vs 'Normal')
  - LAD:  Left Anterior Descending artery stenosis ('Stenotic' vs 'Normal')
  - LCX:  Left Circumflex artery stenosis ('Stenotic' vs 'Normal')
  - RCA:  Right Coronary artery stenosis ('Stenotic' vs 'Normal')

Pipeline Highlights:
  1. Strict Anti-Leakage Constraints:
     - Cath, LAD, LCX, RCA are strictly segregated from the feature matrix (X).
  2. Data Preprocessing & Clinical Feature Engineering:
     - Imputation: median for continuous, mode for categorical.
     - Encoding: robust label encoding with fallback for novel categories.
     - Feature Scaling: standard scaling.
     - Clinical biomarkers: Atherogenic index, NLR, PLR, RPP, ECG Ischemia Score.
  3. Class Imbalance Handling:
     - SMOTE applied within training folds to prevent validation leakage.
  4. Advanced Ensemble Modeling:
     - Soft Voting Classifier combining:
       * Gradient Boosting Classifier (n_estimators=200, lr=0.03, max_depth=4)
       * XGBoost Classifier (n_estimators=200, lr=0.03)
       * Random Forest Classifier (n_estimators=300, max_depth=6)
       * Extra Trees Classifier (n_estimators=300)
  5. 5-Fold Stratified Cross-Validation:
     - Comprehensive logging of Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
  6. SHAP Explainability:
     - TreeExplainer serialization for instant patient feature attribution.
  7. Artifact Serialization:
     - Serializes preprocessor, models, explainers, feature columns, and metadata.
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from typing import Dict, Any, Tuple, List

import numpy as np
import pandas as pd
import joblib
import shap

from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier,
    ExtraTreesClassifier,
    VotingClassifier
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# Ensure project root is in sys.path for running as script from any directory
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, ".."))
for p in [_PROJECT_ROOT, _SCRIPT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Internal preprocessor
try:
    from model.preprocessing import (
        MedicalDataPreprocessor,
        TARGET_COLUMNS
    )
except ModuleNotFoundError:
    from preprocessing import (
        MedicalDataPreprocessor,
        TARGET_COLUMNS
    )

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('CorVita-ML')


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CorVita CAD Ensemble Model Training Pipeline")
    parser.add_argument(
        '--data-path',
        type=str,
        default='model/data/extention of Z-Alizadeh sani dataset.xlsx',
        help="Path to Excel or CSV dataset file"
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='model/saved_models',
        help="Directory to save serialized models and artifacts"
    )
    parser.add_argument(
        '--n-splits',
        type=int,
        default=5,
        help="Number of folds for Stratified Cross-Validation"
    )
    parser.add_argument(
        '--random-state',
        type=int,
        default=42,
        help="Reproducibility random seed"
    )
    return parser.parse_args()


def resolve_path(path: str) -> str:
    """Resolve path considering current working directory, script directory, and project root."""
    if os.path.exists(path):
        return path
    candidate = os.path.join(_SCRIPT_DIR, path)
    if os.path.exists(candidate):
        return candidate
    candidate_root = os.path.join(_PROJECT_ROOT, path)
    if os.path.exists(candidate_root):
        return candidate_root
    if path.startswith("model/"):
        candidate_stripped = os.path.join(_SCRIPT_DIR, path[len("model/"):])
        if os.path.exists(candidate_stripped):
            return candidate_stripped
    return path


def load_dataset(data_path: str) -> pd.DataFrame:
    """Load dataset from Excel or CSV with path verification."""
    resolved_path = resolve_path(data_path)
    if not os.path.exists(resolved_path):
        csv_fallback = resolve_path(data_path.replace('.xlsx', '.csv'))
        if os.path.exists(csv_fallback):
            logger.info(f"Loading CSV dataset fallback from {csv_fallback}")
            return pd.read_csv(csv_fallback)
        raise FileNotFoundError(f"Dataset file not found at: {data_path}")

    logger.info(f"Loading clinical dataset from: {resolved_path}")
    if resolved_path.endswith('.xlsx') or resolved_path.endswith('.xls'):
        return pd.read_excel(resolved_path)
    return pd.read_csv(resolved_path)


def get_base_estimators(random_state: int = 42) -> List[Tuple[str, Any]]:
    """
    Instantiate the four tuned base estimators specified in system requirements:
      1. Gradient Boosting Classifier (n_estimators=200, lr=0.03, max_depth=4)
      2. XGBoost Classifier (n_estimators=200, lr=0.03)
      3. Random Forest Classifier (n_estimators=300, max_depth=6)
      4. Extra Trees Classifier (n_estimators=300)
    """
    gb = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.03,
        max_depth=4,
        subsample=0.85,
        random_state=random_state
    )

    xgb = XGBClassifier(
        n_estimators=200,
        learning_rate=0.03,
        max_depth=4,
        subsample=0.85,
        colsample_bytree=0.8,
        eval_metric='logloss',
        random_state=random_state
    )

    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=6,
        class_weight='balanced',
        random_state=random_state,
        n_jobs=-1
    )

    et = ExtraTreesClassifier(
        n_estimators=300,
        max_depth=8,
        class_weight='balanced',
        random_state=random_state,
        n_jobs=-1
    )

    return [('gb', gb), ('xgb', xgb), ('rf', rf), ('et', et)]


def build_ensemble_classifier(weights: List[float], random_state: int = 42) -> VotingClassifier:
    """Constructs a Soft Voting Classifier combining the four base estimators."""
    estimators = get_base_estimators(random_state=random_state)
    return VotingClassifier(
        estimators=estimators,
        voting='soft',
        weights=weights
    )


def extract_binary_target(df: pd.DataFrame, target_name: str) -> np.ndarray:
    """
    Maps ground-truth angiographic labels to binary 0/1:
      Cath: 'CAD' -> 1, 'Normal' -> 0
      LAD/LCX/RCA: 'Stenotic' -> 1, 'Normal' -> 0
    """
    if target_name not in df.columns:
        raise ValueError(f"Target column '{target_name}' not found in dataset.")

    y_raw = df[target_name].astype(str).str.strip()
    if target_name == 'Cath':
        y_binary = (y_raw.str.upper() == 'CAD').astype(int).values
    else:
        y_binary = (y_raw.str.upper() == 'STENOTIC').astype(int).values
    return y_binary


def evaluate_cross_validation(
    X_df: pd.DataFrame,
    y: np.ndarray,
    target_name: str,
    weights: List[float],
    n_splits: int = 5,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Performs rigorous 5-Fold Stratified Cross-Validation with SMOTE on training folds.
    Returns per-fold metrics and aggregated summary statistics.
    """
    logger.info(f"\n{'='*70}\n[CV] Evaluating Target: {target_name.upper()} ({n_splits}-Fold Stratified CV)\n{'='*70}")

    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)

    fold_metrics = []
    oof_predictions = np.zeros(len(y), dtype=int)
    oof_probabilities = np.zeros(len(y), dtype=float)

    for fold, (train_idx, val_idx) in enumerate(skf.split(X_df, y), 1):
        X_train_raw, X_val_raw = X_df.iloc[train_idx].copy(), X_df.iloc[val_idx].copy()
        y_train, y_val = y[train_idx], y[val_idx]

        # 1. Fit Preprocessor strictly on training fold (Anti-Leakage)
        fold_preprocessor = MedicalDataPreprocessor(with_feature_engineering=True)
        fold_preprocessor.fit(X_train_raw)

        X_train_scaled = fold_preprocessor.transform(X_train_raw)
        X_val_scaled = fold_preprocessor.transform(X_val_raw)

        # 2. Apply SMOTE strictly on training fold
        smote = SMOTE(random_state=random_state + fold)
        X_train_res, y_train_res = smote.fit_resample(X_train_scaled, y_train)

        # 3. Train Soft Voting Ensemble
        ensemble = build_ensemble_classifier(weights=weights, random_state=random_state + fold)
        ensemble.fit(X_train_res, y_train_res)

        # 4. Predict on un-augmented validation fold
        y_proba = ensemble.predict_proba(X_val_scaled)[:, 1]
        y_pred = ensemble.predict(X_val_scaled)

        oof_probabilities[val_idx] = y_proba
        oof_predictions[val_idx] = y_pred

        # 5. Compute fold metrics
        acc = accuracy_score(y_val, y_pred)
        prec = precision_score(y_val, y_pred, zero_division=0)
        rec = recall_score(y_val, y_pred, zero_division=0)
        f1 = f1_score(y_val, y_pred, zero_division=0)
        auc = roc_auc_score(y_val, y_proba)

        fold_metrics.append({
            'fold': fold,
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1_score': f1,
            'roc_auc': auc
        })

        logger.info(
            f"Fold {fold}/{n_splits} - Acc: {acc:.4f} | Prec: {prec:.4f} | "
            f"Rec: {rec:.4f} | F1: {f1:.4f} | AUC: {auc:.4f}"
        )

    # Aggregated Summary
    accs = [m['accuracy'] for m in fold_metrics]
    precs = [m['precision'] for m in fold_metrics]
    recs = [m['recall'] for m in fold_metrics]
    f1s = [m['f1_score'] for m in fold_metrics]
    aucs = [m['roc_auc'] for m in fold_metrics]

    overall_auc = roc_auc_score(y, oof_probabilities)
    overall_acc = accuracy_score(y, oof_predictions)
    overall_prec = precision_score(y, oof_predictions, zero_division=0)
    overall_rec = recall_score(y, oof_predictions, zero_division=0)
    overall_f1 = f1_score(y, oof_predictions, zero_division=0)
    cm = confusion_matrix(y, oof_predictions).tolist()

    summary = {
        'target': target_name,
        'mean_accuracy': float(np.mean(accs)),
        'std_accuracy': float(np.std(accs)),
        'mean_precision': float(np.mean(precs)),
        'std_precision': float(np.std(precs)),
        'mean_recall': float(np.mean(recs)),
        'std_recall': float(np.std(recs)),
        'mean_f1_score': float(np.mean(f1s)),
        'std_f1_score': float(np.std(f1s)),
        'mean_roc_auc': float(np.mean(aucs)),
        'std_roc_auc': float(np.std(aucs)),
        'overall_roc_auc': float(overall_auc),
        'overall_accuracy': float(overall_acc),
        'overall_precision': float(overall_prec),
        'overall_recall': float(overall_rec),
        'overall_f1_score': float(overall_f1),
        'confusion_matrix': cm,
        'fold_metrics': fold_metrics
    }

    logger.info(f"\n--- {target_name.upper()} 5-Fold Stratified CV Benchmark ---")
    logger.info(f"Accuracy:  {summary['mean_accuracy']*100:.2f}% ± {summary['std_accuracy']*100:.2f}%")
    logger.info(f"Precision: {summary['mean_precision']*100:.2f}% ± {summary['std_precision']*100:.2f}%")
    logger.info(f"Recall:    {summary['mean_recall']*100:.2f}% ± {summary['std_recall']*100:.2f}%")
    logger.info(f"F1-Score:  {summary['mean_f1_score']*100:.2f}% ± {summary['std_f1_score']*100:.2f}%")
    logger.info(f"ROC-AUC:   {summary['mean_roc_auc']*100:.2f}% ± {summary['std_roc_auc']*100:.2f}%")
    logger.info(f"Confusion Matrix (TN, FP / FN, TP): {cm}")

    return summary


def train_production_pipeline(
    df: pd.DataFrame,
    output_dir: str,
    n_splits: int = 5,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Executes the complete production training lifecycle:
      1. Isolates feature matrix X from target outcomes (Cath, LAD, LCX, RCA).
      2. Validates performance using 5-Fold Stratified Cross-Validation.
      3. Fits global preprocessor and SMOTE resampler.
      4. Trains production Soft Voting Ensembles for Cath, LAD, LCX, RCA.
      5. Fits SHAP TreeExplainer instances.
      6. Serializes all artifacts into output_dir.
    """
    os.makedirs(output_dir, exist_ok=True)

    # 1. Strict Anti-Leakage Isolation
    leakage_detected = [t for t in TARGET_COLUMNS if t not in df.columns]
    if leakage_detected:
        logger.warning(f"Target columns missing from dataset: {leakage_detected}")

    # Exclude all angiography targets from features
    X_raw = df.drop(columns=[c for c in TARGET_COLUMNS if c in df.columns]).copy()

    # Verify no target columns remain
    for t in TARGET_COLUMNS:
        assert t not in X_raw.columns, f"LEAKAGE ALERT: Target {t} was found in feature matrix!"
    logger.info(f"Verified strict anti-leakage isolation. Feature matrix shape: {X_raw.shape}")

    # Optimized Voting Weights per Target
    # [GradientBoosting, XGBoost, RandomForest, ExtraTrees]
    target_weights = {
        'Cath': [1.8, 1.8, 1.0, 1.0],  # High emphasis on boosted trees for systemic CAD
        'LAD':  [1.5, 1.5, 1.2, 1.0],  # Balanced ensemble for LAD anterior stenosis
        'LCX':  [1.4, 1.4, 1.1, 1.1],  # Circumflex vessel
        'RCA':  [1.4, 1.4, 1.1, 1.1]   # Right coronary vessel
    }

    cv_reports: Dict[str, Any] = {}
    production_models: Dict[str, VotingClassifier] = {}
    production_explainers: Dict[str, Any] = {}

    # 2. Evaluate all 4 targets with 5-Fold Stratified CV
    for target in TARGET_COLUMNS:
        if target in df.columns:
            y = extract_binary_target(df, target)
            weights = target_weights.get(target, [1.0, 1.0, 1.0, 1.0])
            cv_summary = evaluate_cross_validation(
                X_df=X_raw,
                y=y,
                target_name=target,
                weights=weights,
                n_splits=n_splits,
                random_state=random_state
            )
            cv_reports[target] = cv_summary

    # 3. Fit Global Production Preprocessor
    logger.info("\nFitting production MedicalDataPreprocessor on full clinical cohort...")
    preprocessor = MedicalDataPreprocessor(with_feature_engineering=True)
    preprocessor.fit(X_raw)
    X_scaled = preprocessor.transform(X_raw)
    feature_names = preprocessor.get_feature_names()
    logger.info(f"Production feature matrix generated: {X_scaled.shape} ({len(feature_names)} features)")

    # 4. Train and Serialize Final Production Models
    logger.info("\nTraining final production ensembles and generating SHAP TreeExplainers...")
    for target in TARGET_COLUMNS:
        if target not in df.columns:
            continue

        y = extract_binary_target(df, target)
        weights = target_weights.get(target, [1.0, 1.0, 1.0, 1.0])

        # Apply SMOTE to balance classes for final model
        smote = SMOTE(random_state=random_state)
        X_resampled, y_resampled = smote.fit_resample(X_scaled, y)
        logger.info(f"[{target}] Post-SMOTE class distribution: {np.bincount(y_resampled)}")

        # Train Soft Voting Ensemble
        ensemble = build_ensemble_classifier(weights=weights, random_state=random_state)
        ensemble.fit(X_resampled, y_resampled)
        production_models[target] = ensemble

        # 1. Save standard ensemble model (for backward compatibility)
        model_filename = os.path.join(output_dir, f"ensemble_{target}.joblib")
        joblib.dump(ensemble, model_filename, compress=3)
        logger.info(f"Saved {target} ensemble model -> {model_filename}")

        # 2. Save platform-agnostic native XGBoost JSON
        xgb_estimator = ensemble.named_estimators_['xgb']
        xgb_json_filename = os.path.join(output_dir, f"{target.lower()}_xgb.json")
        xgb_estimator.save_model(xgb_json_filename)
        logger.info(f"Saved {target} native XGBoost JSON -> {xgb_json_filename}")

        # 3. Save portable scikit-learn components (pure NumPy, cross-platform)
        sk_data = {
            'gb': ensemble.named_estimators_['gb'],
            'rf': ensemble.named_estimators_['rf'],
            'et': ensemble.named_estimators_['et'],
            'weights': weights,
            'classes_': ensemble.classes_
        }
        sk_filename = os.path.join(output_dir, f"sklearn_ensemble_{target}.joblib")
        joblib.dump(sk_data, sk_filename, compress=3)
        logger.info(f"Saved {target} portable sklearn ensemble -> {sk_filename}")

        # Fit SHAP TreeExplainer on constituent XGBoost estimator
        explainer = shap.TreeExplainer(xgb_estimator)
        production_explainers[target] = explainer

    # 5. Serialize Preprocessor, Feature Columns, and SHAP Explainers
    preprocessor_path = os.path.join(output_dir, "preprocessor.joblib")
    joblib.dump(preprocessor, preprocessor_path, compress=3)
    logger.info(f"Saved preprocessor pipeline -> {preprocessor_path}")

    explainers_path = os.path.join(output_dir, "shap_explainers.joblib")
    joblib.dump(production_explainers, explainers_path, compress=3)
    logger.info(f"Saved SHAP TreeExplainers -> {explainers_path}")

    features_path = os.path.join(output_dir, "feature_columns.json")
    with open(features_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    logger.info(f"Saved feature columns list ({len(feature_names)}) -> {features_path}")

    # 6. Save Comprehensive Pipeline Metadata
    metadata = {
        'pipeline_name': 'CorVita Production Cardiovascular ML Pipeline',
        'dataset_source': 'extention of Z-Alizadeh sani dataset.xlsx',
        'n_patients': int(df.shape[0]),
        'n_features_raw': int(X_raw.shape[1]),
        'n_features_engineered': len(feature_names),
        'targets': TARGET_COLUMNS,
        'cv_strategy': f'{n_splits}-Fold Stratified Cross-Validation',
        'imbalance_strategy': 'SMOTE (Synthetic Minority Over-sampling Technique)',
        'ensemble_architecture': 'Soft Voting Classifier (Gradient Boosting + XGBoost + Random Forest + Extra Trees)',
        'anti_leakage_guarantee': 'Cath, LAD, LCX, RCA strictly removed from feature space',
        'created_at': datetime.utcnow().isoformat(),
        'cv_metrics': cv_reports
    }

    metadata_path = os.path.join(output_dir, "metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved pipeline metadata -> {metadata_path}")

    logger.info(f"\n{'='*70}\n[SUCCESS] Production pipeline training and artifact serialization complete!\n{'='*70}")
    return metadata


if __name__ == '__main__':
    args = parse_arguments()
    dataset = load_dataset(args.data_path)
    output_dir = args.output_dir
    if not os.path.isabs(output_dir):
        if os.path.basename(os.getcwd()) == "model" and output_dir.startswith("model/"):
            output_dir = output_dir[len("model/"):]
        elif os.path.exists(os.path.join(_PROJECT_ROOT, output_dir)):
            output_dir = os.path.join(_PROJECT_ROOT, output_dir)
    train_production_pipeline(
        df=dataset,
        output_dir=output_dir,
        n_splits=args.n_splits,
        random_state=args.random_state
    )
