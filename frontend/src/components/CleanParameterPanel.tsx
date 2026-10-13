'use client';

import * as React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { PatientClinicalData } from '@/types/medical';
import { ClinicalStepperInput } from './ui/clinical-stepper-input';
import { RpgOrnamentSlider } from './ui/rpg-ornament-slider';
import { SegmentedToggle } from './ui/segmented-toggle';
import { MainCategoryTab } from './HogwartsHeaderNav';
import { Button } from './ui/button';

interface CleanParameterPanelProps {
  patient: PatientClinicalData;
  setPatient: React.Dispatch<React.SetStateAction<PatientClinicalData>>;
  activeTab: MainCategoryTab;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export const CleanParameterPanel: React.FC<CleanParameterPanelProps> = ({
  patient,
  setPatient,
  activeTab,
  onRunSimulation,
  isSimulating,
}) => {
  // Generic field updater
  const updateField = <K extends keyof PatientClinicalData>(
    field: K,
    val: PatientClinicalData[K]
  ) => {
    setPatient((prev) => {
      const updated = { ...prev, [field]: val };
      // Synchronize BMI when weight or length changes
      if (field === 'weight' || field === 'length') {
        const heightM = updated.length / 100;
        if (heightM > 0) {
          const calculatedBmi = Number((updated.weight / (heightM * heightM)).toFixed(2));
          updated.bmi = calculatedBmi;
          updated.obesity = calculatedBmi >= 30 ? 'Y' : 'N';
        }
      }
      return updated;
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0F17]/85 rounded-xl border border-slate-800/80 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Scrollable Clinical Inputs Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
        {/* ============================================================== */}
        {/* TAB 1: DEMOGRAPHICS                                           */}
        {/* ============================================================== */}
        {activeTab === 'demographics' && (
          <div className="space-y-4">
            {/* Section Header with Hogwarts Legacy Gold Rule */}
            <div className="space-y-1">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Patient Demographics
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="age"
                label="Age"
                value={patient.age}
                min={20}
                max={95}
                unit="yrs"
                normalMin={25}
                normalMax={65}
                onChange={(v) => updateField('age', v)}
              />

              <SegmentedToggle
                id="sex"
                label="Biological Sex"
                value={patient.sex}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                ]}
                onChange={(v) => updateField('sex', v as 'Male' | 'Female')}
              />
            </div>

            {/* Anthropometrics Section */}
            <div className="space-y-1 pt-2">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Anthropometrics & Body Composition
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="weight"
                label="Body Weight"
                value={patient.weight}
                min={40}
                max={160}
                unit="kg"
                normalMin={50}
                normalMax={85}
                onChange={(v) => updateField('weight', v)}
              />

              <ClinicalStepperInput
                id="length"
                label="Height / Length"
                value={patient.length}
                min={130}
                max={200}
                unit="cm"
                onChange={(v) => updateField('length', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="bmi"
                label="Body Mass Index (BMI)"
                value={patient.bmi}
                min={15}
                max={50}
                step={0.1}
                unit="kg/m²"
                normalMin={18.5}
                normalMax={24.9}
                onChange={(v) => updateField('bmi', v)}
              />

              <SegmentedToggle
                id="obesity"
                label="Clinical Obesity"
                value={patient.obesity}
                options={[
                  { label: 'Non-Obese', value: 'N' },
                  { label: 'Obese (BMI ≥30)', value: 'Y' },
                ]}
                onChange={(v) => updateField('obesity', v as 'Y' | 'N')}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: VITALS & SYMPTOMS                                       */}
        {/* ============================================================== */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Hemodynamic Parameters
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="bp"
                label="Systolic Blood Pressure"
                value={patient.bp}
                min={80}
                max={220}
                unit="mmHg"
                normalMin={90}
                normalMax={120}
                onChange={(v) => updateField('bp', v)}
              />

              <ClinicalStepperInput
                id="pr"
                label="Resting Pulse Rate"
                value={patient.pr}
                min={40}
                max={140}
                unit="bpm"
                normalMin={60}
                normalMax={90}
                onChange={(v) => updateField('pr', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="peakHr"
                label="Peak Stress Heart Rate"
                value={patient.peakHr}
                min={60}
                max={210}
                unit="bpm"
                onChange={(v) => updateField('peakHr', v)}
              />

              <ClinicalStepperInput
                id="peakBp"
                label="Peak Stress Systolic BP"
                value={patient.peakBp}
                min={90}
                max={250}
                unit="mmHg"
                onChange={(v) => updateField('peakBp', v)}
              />
            </div>

            {/* Continuous rating slider for METS */}
            <RpgOrnamentSlider
              id="mets"
              label="Exercise Capacity (METS)"
              value={patient.mets}
              min={1.5}
              max={16.0}
              step={0.5}
              unit="METS"
              ticks={8}
              onChange={(v) => updateField('mets', v)}
            />

            {/* Angina Symptoms Section */}
            <div className="space-y-1 pt-2">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Angina & Symptom Presentation
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <SegmentedToggle
              id="typicalChestPain"
              label="Typical Angina (Retrosternal Pressure)"
              value={patient.typicalChestPain}
              options={[
                { label: 'Absent (0)', value: '0' },
                { label: 'Present (1)', value: '1' },
              ]}
              onChange={(v) => updateField('typicalChestPain', v as '0' | '1')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="atypical"
                label="Atypical Chest Discomfort"
                value={patient.atypical}
                options={[
                  { label: 'Absent', value: 'N' },
                  { label: 'Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('atypical', v as 'Y' | 'N')}
              />

              <SegmentedToggle
                id="exertionalCp"
                label="Exertional Chest Pain"
                value={patient.exertionalCp}
                options={[
                  { label: 'No', value: 'N' },
                  { label: 'Yes', value: 'Y' },
                ]}
                onChange={(v) => updateField('exertionalCp', v as 'Y' | 'N')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="dyspnea"
                label="Dyspnea (Shortness of Breath)"
                value={patient.dyspnea}
                options={[
                  { label: 'Absent', value: 'N' },
                  { label: 'Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('dyspnea', v as 'Y' | 'N')}
              />

              <SegmentedToggle
                id="lowThAng"
                label="Low Threshold Angina"
                value={patient.lowThAng}
                options={[
                  { label: 'No', value: 'N' },
                  { label: 'Yes', value: 'Y' },
                ]}
                onChange={(v) => updateField('lowThAng', v as 'Y' | 'N')}
              />
            </div>

            {/* Continuous slider for NYHA functional class */}
            <RpgOrnamentSlider
              id="functionClass"
              label="NYHA Functional Limitation"
              value={patient.functionClass}
              min={0}
              max={4}
              step={1}
              ticks={5}
              unit="Class"
              onChange={(v) => updateField('functionClass', v)}
            />

            {/* Clinical signs */}
            <div className="space-y-1 pt-2">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Physical Examination Signs
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="edema"
                label="Peripheral Edema"
                value={patient.edema}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'Present (1)', value: '1' },
                ]}
                onChange={(v) => updateField('edema', v as '0' | '1')}
              />

              <SegmentedToggle
                id="weakPeripheralPulse"
                label="Weak Peripheral Pulse"
                value={patient.weakPeripheralPulse}
                options={[
                  { label: 'Normal', value: 'N' },
                  { label: 'Diminished', value: 'Y' },
                ]}
                onChange={(v) => updateField('weakPeripheralPulse', v as 'Y' | 'N')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="lungRales"
                label="Lung Rales / Crackles"
                value={patient.lungRales}
                options={[
                  { label: 'Clear', value: 'N' },
                  { label: 'Audible', value: 'Y' },
                ]}
                onChange={(v) => updateField('lungRales', v as 'Y' | 'N')}
              />

              <SegmentedToggle
                id="systolicMurmur"
                label="Systolic Murmur"
                value={patient.systolicMurmur}
                options={[
                  { label: 'Absent', value: 'N' },
                  { label: 'Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('systolicMurmur', v as 'Y' | 'N')}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LABS & BIOMARKERS                                       */}
        {/* ============================================================== */}
        {activeTab === 'labs' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Glucose & Lipid Biomarkers
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="fbs"
                label="Fasting Blood Sugar (FBS)"
                value={patient.fbs}
                min={60}
                max={400}
                unit="mg/dL"
                normalMin={70}
                normalMax={100}
                onChange={(v) => updateField('fbs', v)}
              />

              <ClinicalStepperInput
                id="a1c"
                label="Glycated Hemoglobin (HbA1c)"
                value={patient.a1c}
                min={4.0}
                max={14.0}
                step={0.1}
                unit="%"
                normalMin={4.5}
                normalMax={5.7}
                onChange={(v) => updateField('a1c', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="ldl"
                label="LDL Cholesterol"
                value={patient.ldl}
                min={20}
                max={300}
                unit="mg/dL"
                normalMin={40}
                normalMax={100}
                onChange={(v) => updateField('ldl', v)}
              />

              <ClinicalStepperInput
                id="hdl"
                label="HDL Cholesterol"
                value={patient.hdl}
                min={15}
                max={90}
                unit="mg/dL"
                normalMin={40}
                normalMax={75}
                onChange={(v) => updateField('hdl', v)}
              />
            </div>

            <ClinicalStepperInput
              id="tg"
              label="Serum Triglycerides (TG)"
              value={patient.tg}
              min={30}
              max={800}
              unit="mg/dL"
              normalMin={50}
              normalMax={150}
              onChange={(v) => updateField('tg', v)}
            />

            {/* Renal & Inflammatory Biomarkers */}
            <div className="space-y-1 pt-2">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Renal & Inflammatory Panel
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="cr"
                label="Serum Creatinine (CR)"
                value={patient.cr}
                min={0.4}
                max={5.0}
                step={0.1}
                unit="mg/dL"
                normalMin={0.6}
                normalMax={1.2}
                onChange={(v) => updateField('cr', v)}
              />

              <ClinicalStepperInput
                id="bun"
                label="Blood Urea Nitrogen (BUN)"
                value={patient.bun}
                min={5}
                max={80}
                unit="mg/dL"
                normalMin={7}
                normalMax={20}
                onChange={(v) => updateField('bun', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ClinicalStepperInput
                id="esr"
                label="Erythrocyte Sed Rate (ESR)"
                value={patient.esr}
                min={1}
                max={100}
                unit="mm/hr"
                normalMin={0}
                normalMax={20}
                onChange={(v) => updateField('esr', v)}
              />

              <ClinicalStepperInput
                id="crp"
                label="C-Reactive Protein (CRP)"
                value={patient.crp}
                min={0.1}
                max={25.0}
                step={0.2}
                unit="mg/L"
                normalMin={0.1}
                normalMax={3.0}
                onChange={(v) => updateField('crp', v)}
              />
            </div>

            {/* Chronic Medical History */}
            <div className="space-y-1 pt-2">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Chronic Co-Morbidities
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="dm"
                label="Diabetes Mellitus (DM)"
                value={patient.dm}
                options={[
                  { label: 'Non-Diabetic', value: 'N' },
                  { label: 'Diabetic (DM)', value: 'Y' },
                ]}
                onChange={(v) => updateField('dm', v as 'Y' | 'N')}
              />

              <SegmentedToggle
                id="htn"
                label="Hypertension (HTN)"
                value={patient.htn}
                options={[
                  { label: 'Normotensive', value: 'N' },
                  { label: 'Hypertensive', value: 'Y' },
                ]}
                onChange={(v) => updateField('htn', v as 'Y' | 'N')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="currentSmoker"
                label="Tobacco Smoking"
                value={patient.currentSmoker}
                options={[
                  { label: 'Non-Smoker', value: 'N' },
                  { label: 'Current Smoker', value: 'Y' },
                ]}
                onChange={(v) => updateField('currentSmoker', v as 'Y' | 'N')}
              />

              <SegmentedToggle
                id="fh"
                label="Family CAD History"
                value={patient.fh}
                options={[
                  { label: 'Negative', value: 'N' },
                  { label: 'Positive FH', value: 'Y' },
                ]}
                onChange={(v) => updateField('fh', v as 'Y' | 'N')}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: ECG / ECHO FINDINGS                                     */}
        {/* ============================================================== */}
        {activeTab === 'ecg' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Electrocardiography (12-Lead ECG)
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="stElevation"
                label="ST Segment Elevation"
                value={patient.stElevation}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'Present (1)', value: '1' },
                ]}
                onChange={(v) => updateField('stElevation', v as '0' | '1')}
              />

              <SegmentedToggle
                id="stDepression"
                label="ST Segment Depression"
                value={patient.stDepression}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'Present (1)', value: '1' },
                ]}
                onChange={(v) => updateField('stDepression', v as '0' | '1')}
              />
            </div>

            {patient.stDepression === '1' && (
              <RpgOrnamentSlider
                id="stDep"
                label="ST Depression Depth"
                value={patient.stDep}
                min={0.5}
                max={4.0}
                step={0.5}
                unit="mm"
                ticks={8}
                onChange={(v) => updateField('stDep', v)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SegmentedToggle
                id="tinversion"
                label="T-Wave Inversion"
                value={patient.tinversion}
                options={[
                  { label: 'Normal Upright', value: '0' },
                  { label: 'Inverted (1)', value: '1' },
                ]}
                onChange={(v) => updateField('tinversion', v as '0' | '1')}
              />

              <SegmentedToggle
                id="qWave"
                label="Pathological Q-Wave"
                value={patient.qWave}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'Present (1)', value: '1' },
                ]}
                onChange={(v) => updateField('qWave', v as '0' | '1')}
              />
            </div>

            <SegmentedToggle
              id="bbb"
              label="Bundle Branch Block (BBB)"
              value={patient.bbb}
              options={[
                { label: 'Normal Conduction', value: 'N' },
                { label: 'LBBB Block', value: 'LBBB' },
              ]}
              onChange={(v) => updateField('bbb', v as 'N' | 'LBBB' | 'RBBB')}
            />

            {/* Echocardiography Section */}
            <div className="space-y-1 pt-2">
              <h2 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                Echocardiography (TTE) & Angiography
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
            </div>

            <ClinicalStepperInput
              id="efTte"
              label="Left Ventricular Ejection Fraction (EF)"
              value={patient.efTte}
              min={15}
              max={70}
              unit="%"
              normalMin={50}
              normalMax={65}
              onChange={(v) => updateField('efTte', v)}
            />

            {/* Continuous rating slider for RWMA wall motion */}
            <RpgOrnamentSlider
              id="regionRwma"
              label="Regional Wall Motion Deficit (RWMA)"
              value={patient.regionRwma}
              min={0}
              max={4}
              step={1}
              ticks={5}
              unit="Score"
              onChange={(v) => updateField('regionRwma', v)}
            />

            {/* Target vessel stenosis */}
            <div className="space-y-1 pt-1">
              <h3 className="font-serif tracking-wider text-[11px] uppercase text-amber-100/60">
                Coronary Vessel Status
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <SegmentedToggle
                id="lad"
                label="LAD (Anterior)"
                value={patient.ladProximal}
                options={[
                  { label: 'Normal', value: 'Normal' },
                  { label: 'Stenotic', value: 'Stenotic' },
                ]}
                onChange={(v) => updateField('ladProximal', v as 'Normal' | 'Stenotic')}
              />

              <SegmentedToggle
                id="lcx"
                label="LCX (Circumflex)"
                value={patient.lcxProximal}
                options={[
                  { label: 'Normal', value: 'Normal' },
                  { label: 'Stenotic', value: 'Stenotic' },
                ]}
                onChange={(v) => updateField('lcxProximal', v as 'Normal' | 'Stenotic')}
              />

              <SegmentedToggle
                id="rca"
                label="RCA (Right Cor.)"
                value={patient.rcaProximal}
                options={[
                  { label: 'Normal', value: 'Normal' },
                  { label: 'Stenotic', value: 'Stenotic' },
                ]}
                onChange={(v) => updateField('rcaProximal', v as 'Normal' | 'Stenotic')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Base Action: "Run Predictive Simulation" Button */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#080B10]/95">
        <Button
          variant="rpg"
          size="lg"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="w-full h-11 text-xs tracking-widest font-serif"
        >
          {isSimulating ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
              <span>Analyzing Clinical Parameters...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Predictive Simulation</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
