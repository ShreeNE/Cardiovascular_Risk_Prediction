/**
 * CorVita ML API Client
 * ====================
 * Production-grade TypeScript client for the CorVita FastAPI inference backend.
 * Routes all predictions through the real ML ensemble models (Gradient Boosting,
 * XGBoost, Random Forest, Extra Trees) trained on the Z-Alizadeh Sani dataset.
 *
 * Falls back to the legacy rule-based score calculator if the API is unavailable.
 */

import { PatientClinicalData, PredictionResult } from '../types/medical';

/**
 * Resolves the backend endpoint URL.
 *
 * In Vercel multi-service deployment:
 * - Server functions communicate with the internal `model` service via
 *   the Vercel service binding injected into `process.env.MODEL_URL`.
 * - Browser/client-side code calls the same-origin Next.js API route `/api/*`,
 *   which proxies requests to `process.env.MODEL_URL`.
 * - Local standalone development falls back to `http://localhost:8000`.
 */
export function getApiEndpoint(path: string): string | URL {
  const cleanPath = path.replace(/^\//, '');

  // 1. Direct server-to-service internal binding (Vercel functions runtime)
  if (typeof window === 'undefined' && process.env.MODEL_URL) {
    const baseUrl = process.env.MODEL_URL.endsWith('/')
      ? process.env.MODEL_URL
      : `${process.env.MODEL_URL}/`;
    return new URL(cleanPath, baseUrl);
  }

  // 2. Explicit public URL override if configured
  if (process.env.NEXT_PUBLIC_API_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL.endsWith('/')
      ? process.env.NEXT_PUBLIC_API_URL
      : `${process.env.NEXT_PUBLIC_API_URL}/`;
    return new URL(cleanPath, baseUrl);
  }

  // 3. Client-side browser execution (routed through Next.js proxy route)
  if (typeof window !== 'undefined') {
    return `/api/${cleanPath}`;
  }

  // 4. Standalone development fallback
  return new URL(cleanPath, 'http://localhost:8000/');
}

// ── API Response Types ────────────────────────────────────────────────────────
interface SHAPAttribution {
  rank: number;
  feature: string;
  display_name: string;
  shap_value: number;
  abs_impact: number;
  direction: 'risk-increasing' | 'risk-reducing';
}

interface TargetResult {
  probability: number;
  probability_pct: number;
  predicted_label: string;
  predicted_class: number;
  risk_label: string;
  severity: string;
  shap_attributions: SHAPAttribution[];
}

interface APIResponse {
  status: string;
  latency_ms: number;
  cad_probability: number;
  cad_probability_pct: number;
  cad_diagnosis: string;
  risk_label: string;
  risk_severity: string;
  overall_risk_score: number;
  lad_probability: number;
  lad_probability_pct: number;
  lad_diagnosis: string;
  lad_risk_label: string;
  lad_severity: string;
  lcx_probability: number;
  lcx_probability_pct: number;
  lcx_diagnosis: string;
  lcx_risk_label: string;
  lcx_severity: string;
  rca_probability: number;
  rca_probability_pct: number;
  rca_diagnosis: string;
  rca_risk_label: string;
  rca_severity: string;
  predicted_vessels: number;
  multi_vessel_disease: boolean;
  key_risk_factors: Array<{
    name: string;
    feature: string;
    severity: string;
    impact: string;
    shap: number;
  }>;
  protective_factors: string[];
  shap_cath: SHAPAttribution[];
  shap_lad: SHAPAttribution[];
  shap_lcx: SHAPAttribution[];
  shap_rca: SHAPAttribution[];
  targets: { [key: string]: TargetResult };
}

// ── Patient Data Payload Mapping ────────────────────────────────────────────────
/**
 * Maps the frontend PatientClinicalData (camelCase) → API column names (PascalCase / space-separated).
 * Only passes fields that exist in the Z-Alizadeh Sani dataset feature space.
 */
function buildApiPayload(patient: PatientClinicalData): Record<string, unknown> {
  const boolToInt = (v: 'Y' | 'N' | undefined): number =>
    v === 'Y' ? 1 : 0;
  const bitToInt = (v: '0' | '1' | undefined): number =>
    v === '1' ? 1 : 0;

  return {
    Age: patient.age,
    Weight: patient.weight,
    Length: patient.length,
    Sex: patient.sex === 'Female' ? 'Fmale' : 'Male',
    BMI: patient.bmi,
    DM: boolToInt(patient.dm as 'Y' | 'N'),
    HTN: boolToInt(patient.htn as 'Y' | 'N'),
    'Current Smoker': boolToInt(patient.currentSmoker as 'Y' | 'N'),
    'EX-Smoker': boolToInt(patient.exSmoker as 'Y' | 'N'),
    FH: boolToInt(patient.fh as 'Y' | 'N'),
    Obesity: patient.obesity,
    CRF: patient.crf,
    CVA: patient.cva,
    'Airway disease': patient.airwayDisease,
    'Thyroid Disease': patient.thyroidDisease,
    CHF: patient.chf,
    DLP: patient.dlp,
    BP: patient.bp,
    PR: patient.pr,
    Edema: bitToInt(patient.edema as '0' | '1'),
    'Weak Peripheral Pulse': patient.weakPeripheralPulse,
    'Lung rales': patient.lungRales,
    'Systolic Murmur': patient.systolicMurmur,
    'Diastolic Murmur': patient.diastolicMurmur,
    'Typical Chest Pain': bitToInt(patient.typicalChestPain as '0' | '1'),
    Dyspnea: patient.dyspnea,
    'Function Class': patient.functionClass,
    Atypical: patient.atypical,
    Nonanginal: patient.nonanginal,
    'Exertional CP': patient.exertionalCp,
    'LowTH Ang': patient.lowThAng,
    'Q Wave': bitToInt(patient.qWave as '0' | '1'),
    'St Elevation': bitToInt(patient.stElevation as '0' | '1'),
    'St Depression': bitToInt(patient.stDepression as '0' | '1'),
    Tinversion: bitToInt(patient.tinversion as '0' | '1'),
    LVH: patient.lvh,
    'Poor R Progression': patient.poorRProgression,
    BBB: patient.bbb,
    FBS: patient.fbs,
    CR: patient.cr,
    TG: patient.tg,
    LDL: patient.ldl,
    HDL: patient.hdl,
    BUN: patient.bun,
    ESR: patient.esr,
    HB: patient.hb,
    K: patient.k,
    Na: patient.na,
    WBC: patient.wbc,
    Lymph: patient.lymph,
    Neut: patient.neut,
    PLT: patient.plt,
    'EF-TTE': patient.efTte,
    'Region RWMA': patient.regionRwma,
    VHD: patient.vhd,
  };
}

// ── API Response → PredictionResult Adapter ──────────────────────────────────
function adaptApiResponse(apiResp: APIResponse, patient: PatientClinicalData): PredictionResult {
  const riskCategory = (() => {
    const pct = apiResp.cad_probability_pct;
    if (pct >= 80) return 'Critical CAD';
    if (pct >= 60) return 'High Risk';
    if (pct >= 40) return 'Moderate Risk';
    return 'Low Risk';
  })() as PredictionResult['riskCategory'];

  const keyRiskFactors: PredictionResult['keyRiskFactors'] = [
    // From SHAP Cath attributions
    ...apiResp.shap_cath
      .filter(a => a.direction === 'risk-increasing')
      .slice(0, 5)
      .map(a => ({
        name: a.display_name,
        value: `SHAP: +${a.abs_impact.toFixed(3)}`,
        severity: (a.abs_impact > 0.5 ? 'critical' : a.abs_impact > 0.3 ? 'high' : a.abs_impact > 0.15 ? 'moderate' : 'low') as 'low' | 'moderate' | 'high' | 'critical',
        impact: `Increases CAD risk by ${(a.abs_impact * 100).toFixed(1)} log-odds units`,
      })),
    // From SHAP LAD
    ...apiResp.shap_lad
      .filter(a => a.direction === 'risk-increasing')
      .slice(0, 2)
      .map(a => ({
        name: `${a.display_name} (LAD)`,
        value: `SHAP: +${a.abs_impact.toFixed(3)}`,
        severity: (a.abs_impact > 0.4 ? 'high' : 'moderate') as 'low' | 'moderate' | 'high' | 'critical',
        impact: `Elevates LAD stenosis probability`,
      })),
  ].slice(0, 8);

  const protectiveFactors: string[] = apiResp.shap_cath
    .filter(a => a.direction === 'risk-reducing')
    .slice(0, 4)
    .map(a => `${a.display_name} (protective, SHAP: ${a.shap_value.toFixed(3)})`);

  const clinicalObservations: string[] = [
    `Soft Voting Ensemble: GB + XGBoost + RF + ExtraTrees (5-Fold Stratified CV)`,
    `Overall CAD probability: ${apiResp.cad_probability_pct.toFixed(1)}% (${apiResp.cad_diagnosis})`,
    `Vessel stenosis — LAD: ${apiResp.lad_probability_pct.toFixed(1)}% | LCX: ${apiResp.lcx_probability_pct.toFixed(1)}% | RCA: ${apiResp.rca_probability_pct.toFixed(1)}%`,
    `Predicted vessel involvement: ${apiResp.predicted_vessels} ${apiResp.multi_vessel_disease ? '(Multi-Vessel Disease)' : ''}`,
    `Inference latency: ${apiResp.latency_ms.toFixed(0)}ms`,
  ];

  return {
    overallRiskScore: apiResp.overall_risk_score,
    cadProbability: apiResp.cad_probability,
    riskCategory,
    ladStenosisRisk: apiResp.lad_probability_pct,
    lcxStenosisRisk: apiResp.lcx_probability_pct,
    rcaStenosisRisk: apiResp.rca_probability_pct,
    predictedVessels: apiResp.predicted_vessels,
    cathDiagnosis: apiResp.cad_diagnosis as 'Normal' | 'CAD',
    keyRiskFactors,
    protectiveFactors,
    clinicalObservations,
    simulationTimestamp: new Date().toISOString(),
  };
}

// ── Legacy Rule-Based Fallback ───────────────────────────────────────────────
function legacyFallbackPrediction(patient: PatientClinicalData): PredictionResult {
  let score = 0;
  if (patient.typicalChestPain === '1') score += 26;
  if (patient.stElevation === '1') score += 28;
  if (patient.stDepression === '1') score += 18;
  if (patient.tinversion === '1') score += 12;
  if (patient.htn === 'Y') score += 8;
  if (patient.dm === 'Y') score += 8;
  if (patient.currentSmoker === 'Y') score += 7;
  if (patient.fh === 'Y') score += 6;
  if (patient.sex === 'Male' && patient.age > 45) score += 9;
  if (patient.regionRwma > 0) score += patient.regionRwma * 5;
  if (patient.efTte < 40) score += 12;

  const pct = Math.min(score, 99);
  const cadProb = pct / 100;

  const riskCategory: PredictionResult['riskCategory'] =
    pct >= 80 ? 'Critical CAD' : pct >= 60 ? 'High Risk' : pct >= 40 ? 'Moderate Risk' : 'Low Risk';

  return {
    overallRiskScore: pct,
    cadProbability: cadProb,
    riskCategory,
    ladStenosisRisk: pct * 0.85,
    lcxStenosisRisk: pct * 0.72,
    rcaStenosisRisk: pct * 0.68,
    predictedVessels: pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 40 ? 1 : 0,
    cathDiagnosis: pct >= 50 ? 'CAD' : 'Normal',
    keyRiskFactors: [],
    protectiveFactors: ['(Legacy rule-based fallback — API unavailable)'],
    clinicalObservations: [
      'Using rule-based score fallback (ML API offline)',
      `Estimated risk score: ${pct}%`,
    ],
    simulationTimestamp: new Date().toISOString(),
  };
}

// ── Primary Export ────────────────────────────────────────────────────────────
/**
 * Runs real-time ML inference via the CorVita FastAPI backend.
 * Falls back to rule-based calculation if API is unreachable.
 */
export async function runCadMLInference(patient: PatientClinicalData): Promise<PredictionResult> {
  const payload = buildApiPayload(patient);

  try {
    const endpoint = getApiEndpoint('predict');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000), // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const apiResp: APIResponse = await response.json();
    return adaptApiResponse(apiResp, patient);
  } catch (error) {
    console.warn('[CorVita] ML API call failed, using fallback:', error);
    return legacyFallbackPrediction(patient);
  }
}

/**
 * Synchronous legacy version (used as fallback in non-async contexts).
 * Retained for backwards compatibility.
 */
export function runCadPredictiveSimulation(patient: PatientClinicalData): PredictionResult {
  return legacyFallbackPrediction(patient);
}

/** Checks if the FastAPI backend is reachable */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const endpoint = getApiEndpoint('health');
    const resp = await fetch(endpoint, { signal: AbortSignal.timeout(3000) });
    return resp.ok;
  } catch {
    return false;
  }
}
