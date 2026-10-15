'use client';

import * as React from 'react';
import { Play, ClipboardList, User, Scale, Ruler, Info, Calculator, ChevronDown, ChevronRight, Dna, ShieldAlert } from 'lucide-react';
import { PatientClinicalData } from '@/types/medical';
import { ClinicalStepperInput } from './ui/clinical-stepper-input';
import { RpgOrnamentSlider } from './ui/rpg-ornament-slider';
import { SegmentedToggle } from './ui/segmented-toggle';
import { MainCategoryTab } from './HogwartsHeaderNav';
import { cn } from '@/lib/utils';
import { medicalDictionary } from '@/data/medicalDictionary';

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
  const [bmiTooltip, setBmiTooltip] = React.useState(false);

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

  // BMI status category helper
  const getBmiStatus = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-sky-400', dot: 'bg-sky-400' };
    if (bmi < 25) return { label: 'Normal', color: 'text-emerald-400', dot: 'bg-emerald-400' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-[#F12F4B]', dot: 'bg-[#F12F4B]' };
    return { label: 'Obese', color: 'text-rose-400', dot: 'bg-rose-400' };
  };

  const bmiStatus = getBmiStatus(patient.bmi);

  return (
    <div className="w-full h-full flex flex-col glass-panel-premium rounded-2xl overflow-hidden select-none">
      {/* ── Panel Header ─────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-white/10 bg-[rgba(2,6,23,0.60)] backdrop-blur-md flex items-center justify-between shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl border border-[rgba(255,83,107,0.75)] bg-gradient-to-br from-[#FF536B] via-[#FF3158] to-[#C41838] flex items-center justify-center text-white shadow-[0_0_18px_rgba(255,49,88,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 17c0-2 2.2-3 5-3s5 1 5 3" />
            </svg>
          </div>
          <div>
            <h2 className="font-sans tracking-wider text-xs uppercase font-extrabold text-[#F4F6FF] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
              {activeTab === 'demographics' && 'PATIENT DEMOGRAPHICS'}
              {activeTab === 'vitals' && 'VITALS & SYMPTOMS'}
              {activeTab === 'labs' && 'LAB & BIOMARKERS'}
              {activeTab === 'ecg' && 'ECG & ECHO FINDINGS'}
            </h2>
            <p className="text-[10px] text-[#A9BED8] font-sans">
              {activeTab === 'demographics' && 'Enter clinical details to assess cardiovascular risk'}
              {activeTab === 'vitals' && 'Hemodynamic stability and symptomatic angina'}
              {activeTab === 'labs' && 'Metabolic panel, lipid profile, and biomarkers'}
              {activeTab === 'ecg' && 'Electrocardiogram and echocardiographic criteria'}
            </p>
          </div>
        </div>

        {/* Faint Red ECG Wave graphic */}
        <div className="hidden sm:block pointer-events-none opacity-50">
          <svg className="w-24 h-6 text-[#FF3158]" viewBox="0 0 100 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M0 12h35l4-7 5 14 6-18 5 21 4-10h41" />
          </svg>
        </div>
      </div>

      {/* Scrollable Clinical Inputs Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-[#471328]/70 scrollbar-track-transparent">
        {/* ============================================================== */}
        {/* TAB 1: DEMOGRAPHICS                                           */}
        {/* ============================================================== */}
        {activeTab === 'demographics' && (
          <div className="space-y-4">
            {/* Row 1: Age & Biological Sex */}
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

              <div className="glass-card-premium rounded-xl p-2.5 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Dna className="w-3.5 h-3.5 text-[#FF3158] drop-shadow-[0_0_6px_rgba(255,49,88,0.6)]" />
                    <span className="text-[11px] font-medium text-[#F4F6FF] font-sans">
                      Biological Sex
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateField('sex', 'Male')}
                    className={cn(
                      'h-8 rounded-lg border px-2.5 text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer select-none',
                      patient.sex === 'Male'
                        ? 'btn-corvita-selected font-semibold text-white'
                        : 'btn-corvita-ghost text-[#A9BED8]'
                    )}
                  >
                    <span>♂</span>
                    <span>Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('sex', 'Female')}
                    className={cn(
                      'h-8 rounded-lg border px-2.5 text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer select-none',
                      patient.sex === 'Female'
                        ? 'btn-corvita-selected font-semibold text-white'
                        : 'btn-corvita-ghost text-[#A9BED8]'
                    )}
                  >
                    <span>♀</span>
                    <span>Female</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Anthropometrics Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FF3158]/20 border border-[#FF3158]/60 flex items-center justify-center text-[#FF3158] shadow-[0_0_8px_rgba(255,49,88,0.4)]">
                    <User className="w-3 h-3" />
                  </div>
                  <h3 className="font-sans tracking-wider text-[11px] uppercase font-bold text-[#F4F6FF]">
                    Anthropometrics & Body Composition
                  </h3>
                </div>
                <ChevronDown className="w-4 h-4 text-[#A9BED8]" />
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Weight Card with Scale Icon */}
                <div className="glass-card-premium rounded-xl p-2.5 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#FF3158] drop-shadow-[0_0_6px_rgba(255,49,88,0.6)]" />
                      <span className="text-[11px] font-medium text-[#F4F6FF] font-sans">
                        Body Weight
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A9BED8]">
                      Ref: 50–85 kg
                    </span>
                  </div>
                  <div className="relative flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateField('weight', Math.max(40, patient.weight - 1))}
                      aria-label="Decrease Body Weight"
                      className="btn-corvita-stepper font-mono text-sm font-bold"
                    >
                      -
                    </button>
                    <div className="flex-1 h-8 bg-[rgba(3,9,20,0.94)] border border-[rgba(145,173,221,0.20)] rounded-lg flex items-center justify-center gap-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                      <span className="text-xs font-mono font-bold text-[#F4F6FF]">{patient.weight}</span>
                      <span className="text-[10px] font-mono text-[#A9BED8]">kg</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('weight', Math.min(160, patient.weight + 1))}
                      aria-label="Increase Body Weight"
                      className="btn-corvita-stepper font-mono text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Height Card with Ruler Icon */}
                <div className="glass-card-premium rounded-xl p-2.5 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#FF3158] drop-shadow-[0_0_6px_rgba(255,49,88,0.6)]" />
                      <span className="text-[11px] font-medium text-[#F4F6FF] font-sans">
                        Height / Length
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#A9BED8]">
                      Ref: 150–190 cm
                    </span>
                  </div>
                  <div className="relative flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateField('length', Math.max(130, patient.length - 1))}
                      aria-label="Decrease Height"
                      className="btn-corvita-stepper font-mono text-sm font-bold"
                    >
                      -
                    </button>
                    <div className="flex-1 h-8 bg-[rgba(3,9,20,0.94)] border border-[rgba(145,173,221,0.20)] rounded-lg flex items-center justify-center gap-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                      <span className="text-xs font-mono font-bold text-[#F4F6FF]">{patient.length}</span>
                      <span className="text-[10px] font-mono text-[#A9BED8]">cm</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('length', Math.min(200, patient.length + 1))}
                      aria-label="Increase Height"
                      className="btn-corvita-stepper font-mono text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* BMI and Clinical Obesity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BMI Card */}
                <div className="glass-card-premium rounded-xl p-2.5 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#FF3158] drop-shadow-[0_0_6px_rgba(255,49,88,0.6)]" />
                      <span className="text-[11px] font-medium text-[#F4F6FF] font-sans">
                        Body Mass Index (BMI)
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setBmiTooltip(true)}
                          onMouseLeave={() => setBmiTooltip(false)}
                          onClick={() => setBmiTooltip(!bmiTooltip)}
                          className="text-[#A9BED8] hover:text-[#FF3158] transition-colors cursor-pointer"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                        {bmiTooltip && (
                          <div className="absolute left-0 bottom-5 z-50 w-56 rounded-xl border border-[rgba(255,49,88,0.5)] bg-[rgba(12,19,35,0.95)] backdrop-blur-xl p-2.5 shadow-2xl text-[10px] text-[#F4F6FF] pointer-events-none font-sans">
                            <div className="font-semibold text-[#FF3158] font-serif mb-0.5">Body Mass Index</div>
                            <div className="text-[#A9BED8]">Weight (kg) divided by height squared (m²). Standard index for adiposity.</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-[#FF3158] bg-[#FF3158]/10 border border-[#FF3158]/40 px-2 py-0.5 rounded-lg text-right leading-tight shadow-[0_0_8px_rgba(255,49,88,0.25)]">
                      Ref: 18.5 – 24.9<br />kg/m²
                    </span>
                  </div>

                  {/* Stepper row */}
                  <div className="relative flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateField('bmi', Number((Math.max(15, patient.bmi - 0.2)).toFixed(2)))}
                      aria-label="Decrease BMI"
                      className="btn-corvita-stepper font-mono text-sm font-bold"
                    >
                      -
                    </button>
                    <div className="flex-1 h-8 bg-[rgba(3,9,20,0.94)] border border-[rgba(145,173,221,0.20)] rounded-lg flex items-center justify-center gap-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                      <span className="text-xs font-mono font-bold text-[#F4F6FF]">{patient.bmi.toFixed(1)}</span>
                      <span className="text-[10px] font-mono text-[#A9BED8]">kg/m²</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('bmi', Number((Math.min(50, patient.bmi + 0.2)).toFixed(2)))}
                      aria-label="Increase BMI"
                      className="btn-corvita-stepper font-mono text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* BMI Status Badge — own row to prevent overflow */}
                  <div className="flex items-center gap-1.5 mt-1.5 pl-0.5">
                    <span className={cn('w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse', bmiStatus.dot)} />
                    <span className={cn('text-[10px] font-sans font-medium', bmiStatus.color)}>
                      {bmiStatus.label}
                    </span>
                  </div>
                </div>

                {/* Clinical Obesity */}
                <div className="glass-card-premium rounded-xl p-2.5 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#FF3158] drop-shadow-[0_0_6px_rgba(255,49,88,0.6)]" />
                      <span className="text-[11px] font-medium text-[#F4F6FF] font-sans">
                        Clinical Obesity
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateField('obesity', 'N')}
                      className={cn(
                        'h-8 rounded-lg border px-2 text-xs font-medium transition-all duration-150 flex items-center justify-center cursor-pointer select-none',
                        patient.obesity === 'N'
                          ? 'btn-corvita-selected font-semibold text-white'
                          : 'btn-corvita-ghost text-[#A9BED8]'
                      )}
                    >
                      Non-Obese
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('obesity', 'Y')}
                      className={cn(
                        'h-8 rounded-lg border px-2 text-xs font-medium transition-all duration-150 flex items-center justify-center cursor-pointer select-none',
                        patient.obesity === 'Y'
                          ? 'btn-corvita-selected font-semibold text-white'
                          : 'btn-corvita-ghost text-[#A9BED8]'
                      )}
                    >
                      Obese (BMI ≥30)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: VITALS & SYMPTOMS                                       */}
        {/* ============================================================== */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Hemodynamic Parameters
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Angina & Symptom Presentation
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Physical Examination Signs
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Glucose & Lipid Biomarkers
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Renal & Inflammatory Panel
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Chronic Co-Morbidities
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Electrocardiography (12-Lead ECG)
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h3 className="font-serif tracking-widest text-xs uppercase text-[#E8EDF3]/90 font-bold">
                Echocardiography (TTE) & Angiography
              </h3>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#F04452]/40 via-[#651E2B]/20 to-transparent" />
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
              <h4 className="font-serif tracking-wider text-[11px] uppercase text-[#8FA1B5]">
                Coronary Vessel Status
              </h4>
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
      <div className="p-4 border-t border-white/10 bg-[rgba(2,6,23,0.55)] backdrop-blur-md shrink-0 space-y-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="relative w-full h-12 rounded-xl bg-gradient-to-r from-[#FF536B] via-[#FF3158] to-[#C41838] hover:from-[#FF6B82] hover:via-[#FF4267] hover:to-[#D61E42] border border-[rgba(255,83,107,0.9)] text-[#F4F6FF] font-sans font-black text-xs uppercase tracking-wider glass-simulation-button transition-all flex items-center justify-between px-5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden active:scale-[0.99] group"
        >
          {/* Glass Top Specular Sheen */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

          {isSimulating ? (
            <div className="w-full flex items-center justify-center gap-2 relative z-10">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Analyzing Clinical Parameters...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 relative z-10">
                <span className="text-white/60 font-mono text-sm leading-none select-none">&lt;</span>
                <Play className="w-4 h-4 fill-white text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.85)] ml-1" />
                <span className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] tracking-wider">RUN PREDICTIVE SIMULATION</span>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <svg className="w-16 h-5 text-[#FF9EAF] drop-shadow-[0_0_6px_rgba(255,158,175,0.85)]" viewBox="0 0 80 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M0 10h25l3-5 4 10 5-13 4 16 3-8h36" />
                </svg>
                <ChevronRight className="w-4 h-4 text-white/90 transition-transform group-hover:translate-x-0.5" />
              </div>
            </>
          )}
        </button>

        {/* 2-line Disclaimer Note below button */}
        <div className="flex items-start gap-2 px-1 text-[10px] text-[#A9BED8] leading-tight">
          <ShieldAlert className="w-3.5 h-3.5 text-[#FF3158] shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(255,49,88,0.7)]" />
          <div className="flex flex-col">
            <span>For educational and decision-support purposes only.</span>
            <span className="text-[#70849F]">Not a substitute for professional medical assessment or diagnostic imaging.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
