export interface PatientClinicalData {
  // Demographics & Anthropometrics
  age: number; // 20 - 95 yrs
  sex: 'Male' | 'Female';
  weight: number; // kg (40 - 160)
  length: number; // height in cm (130 - 200)
  bmi: number; // kg/m^2 (auto-calculated or manual)
  obesity: 'Y' | 'N';

  // Hemodynamics & Vitals
  bp: number; // Systolic BP mmHg (80 - 220)
  pr: number; // Pulse Rate bpm (40 - 140)
  peakHr: number; // Peak HR bpm (60 - 200)
  peakBp: number; // Peak BP mmHg (90 - 250)
  mets: number; // Metabolic equivalents (1 - 18)

  // Medical History & Chronic Conditions
  dm: 'Y' | 'N'; // Diabetes Mellitus
  htn: 'Y' | 'N'; // Hypertension
  currentSmoker: 'Y' | 'N';
  exSmoker: 'Y' | 'N';
  fh: 'Y' | 'N'; // Family History CAD
  crf: 'Y' | 'N'; // Chronic Renal Failure
  cva: 'Y' | 'N'; // Cerebrovascular Accident (Stroke)
  airwayDisease: 'Y' | 'N'; // COPD / Asthma
  thyroidDisease: 'Y' | 'N';
  chf: 'Y' | 'N'; // Congestive Heart Failure
  dlp: 'Y' | 'N'; // Dyslipidemia

  // Current Medications
  insulin: 'Y' | 'N';
  betaBlocker: 'Y' | 'N';
  statin: 'Y' | 'N';
  nitrat: 'Y' | 'N';
  asa: 'Y' | 'N'; // Aspirin
  plavix: 'Y' | 'N'; // Clopidogrel
  ace: 'Y' | 'N'; // ACE Inhibitor
  diuretic: 'Y' | 'N';

  // Physical Examination & Clinical Signs
  edema: '0' | '1';
  weakPeripheralPulse: 'Y' | 'N';
  lungRales: 'Y' | 'N';
  systolicMurmur: 'Y' | 'N';
  diastolicMurmur: 'Y' | 'N';
  dyspnea: 'Y' | 'N';
  functionClass: number; // NYHA Class 0 - 4

  // Chest Pain & Anginal Symptoms
  typicalChestPain: '0' | '1';
  atypical: 'Y' | 'N';
  nonanginal: 'Y' | 'N';
  exertionalCp: 'Y' | 'N';
  lowThAng: 'Y' | 'N'; // Low Threshold Angina

  // ECG & Electrophysiology
  rhythm: 'Sinus' | 'AF' | 'Other';
  rate: number; // bpm
  qWave: '0' | '1';
  stElevation: '0' | '1';
  stDepression: '0' | '1';
  tinversion: '0' | '1';
  lvh: 'Y' | 'N'; // Left Ventricular Hypertrophy
  poorRProgression: 'Y' | 'N';
  bbb: 'N' | 'LBBB' | 'RBBB'; // Bundle Branch Block
  stDep: number; // mm of depression (0 - 5 mm)
  stDepLeadNumber: number; // 0 - 6 leads

  // Laboratory Biomarkers & Chemistry
  fbs: number; // Fasting Blood Sugar mg/dL (60 - 400)
  cr: number; // Creatinine mg/dL (0.4 - 5.0)
  tg: number; // Triglycerides mg/dL (30 - 800)
  ldl: number; // LDL Cholesterol mg/dL (20 - 300)
  hdl: number; // HDL Cholesterol mg/dL (15 - 90)
  bun: number; // Blood Urea Nitrogen mg/dL (5 - 80)
  a1c: number; // HbA1c % (4.5 - 14.0)
  esr: number; // Erythrocyte Sed Rate mm/hr (1 - 100)
  crp: number; // C-Reactive Protein mg/L (0.1 - 25)
  proteinuria: 'Y' | 'N';
  hb: number; // Hemoglobin g/dL (7 - 20)
  k: number; // Potassium mmol/L (2.5 - 6.5)
  na: number; // Sodium mmol/L (120 - 160)
  wbc: number; // White Blood Cells /uL (3000 - 20000)
  lymph: number; // % Lymphocytes (5 - 60)
  neut: number; // % Neutrophils (20 - 90)
  plt: number; // Platelets x10^3 (80 - 750)
  t3: number; // ng/dL (60 - 220)
  t4: number; // ug/dL (4 - 14)
  tsh: number; // uIU/mL (0.2 - 10.0)
  ast: number; // U/L (10 - 150)
  alt: number; // U/L (10 - 150)
  alp: number; // U/L (30 - 350)

  // Echocardiography & Cardiac Imaging (TTE / MPI / Cath)
  efTte: number; // Ejection Fraction % (15 - 70)
  regionRwma: number; // Regional Wall Motion Abnormality score (0 - 4)
  vhd: 'N' | 'mild' | 'Moderate' | 'Severe'; // Valvular Heart Disease
  reversibleIschemicRegionMpi: number; // 0 - 4 segments
  irreversibleIschemicRegionMpi: number; // 0 - 4 segments
  numberVesselInvolved: number; // 0 - 3 vessels
  numberLesion: number; // 0 - 5 lesions
  pciCath: 'Y' | 'N';

  // Coronary Anatomy Segments (Clinical Targets & Findings)
  lmProximal: 'Normal' | 'Stenotic';
  lmDistal: 'Normal' | 'Stenotic';
  ladProximal: 'Normal' | 'Stenotic';
  ladMid: 'Normal' | 'Stenotic';
  ladDistal: 'Normal' | 'Stenotic';
  lcxProximal: 'Normal' | 'Stenotic';
  lcxMid: 'Normal' | 'Stenotic';
  lcxDistal: 'Normal' | 'Stenotic';
  rcaProximal: 'Normal' | 'Stenotic';
  rcaMid: 'Normal' | 'Stenotic';
  rcaDistal: 'Normal' | 'Stenotic';
}

export interface PredictionResult {
  overallRiskScore: number; // 0 - 100%
  cadProbability: number; // 0.0 - 1.0
  riskCategory: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical CAD';
  ladStenosisRisk: number; // 0 - 100%
  lcxStenosisRisk: number; // 0 - 100%
  rcaStenosisRisk: number; // 0 - 100%
  predictedVessels: number; // 0, 1, 2, or 3
  cathDiagnosis: 'Normal' | 'CAD';
  keyRiskFactors: Array<{
    name: string;
    value: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    impact: string;
  }>;
  protectiveFactors: string[];
  clinicalObservations: string[];
  simulationTimestamp: string;
}

export type CategoryTab =
  | 'demographics'
  | 'vitals'
  | 'history'
  | 'symptoms'
  | 'exam'
  | 'ecg'
  | 'labs'
  | 'echo'
  | 'meds';

export interface ArchetypePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  iconName: string;
  color: string;
  data: Partial<PatientClinicalData>;
}
