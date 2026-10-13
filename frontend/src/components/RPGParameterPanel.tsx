'use client';

import React, { useState } from 'react';
import {
  User,
  HeartPulse,
  History,
  AlertCircle,
  Stethoscope,
  Activity,
  TestTube,
  Scan,
  Pill,
  Sparkles,
  Dices,
  RotateCcw,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { PatientClinicalData, CategoryTab } from '../types/medical';
import { RPGSlider } from './RPGSlider';
import { RPGToggle } from './RPGToggle';
import { archetypePresets, defaultBaselinePatient } from '../data/patientArchetypes';

interface RPGParameterPanelProps {
  patient: PatientClinicalData;
  setPatient: React.Dispatch<React.SetStateAction<PatientClinicalData>>;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export const RPGParameterPanel: React.FC<RPGParameterPanelProps> = ({
  patient,
  setPatient,
  onRunSimulation,
  isSimulating,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('demographics');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('healthy-control');

  // Generic updater
  const updateField = <K extends keyof PatientClinicalData>(
    field: K,
    val: PatientClinicalData[K]
  ) => {
    setPatient((prev) => {
      const updated = { ...prev, [field]: val };
      // Auto-compute BMI when Weight or Height changes
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

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = archetypePresets.find((p) => p.id === presetId);
    if (found && found.data) {
      setPatient((prev) => ({
        ...prev,
        ...found.data,
      }));
    }
  };

  // Randomize Parameters (RPG Dice roll)
  const handleRandomize = () => {
    setPatient((prev) => {
      const randomAge = Math.floor(Math.random() * 45) + 38;
      const randomSex = Math.random() > 0.4 ? 'Male' : 'Female';
      const randomWeight = Math.floor(Math.random() * 45) + 55;
      const randomLength = Math.floor(Math.random() * 30) + 150;
      const heightM = randomLength / 100;
      const randomBmi = Number((randomWeight / (heightM * heightM)).toFixed(2));

      return {
        ...prev,
        age: randomAge,
        sex: randomSex,
        weight: randomWeight,
        length: randomLength,
        bmi: randomBmi,
        obesity: randomBmi >= 30 ? 'Y' : 'N',
        bp: Math.floor(Math.random() * 60) + 105,
        pr: Math.floor(Math.random() * 45) + 60,
        peakHr: Math.floor(Math.random() * 55) + 120,
        fbs: Math.floor(Math.random() * 150) + 80,
        ldl: Math.floor(Math.random() * 120) + 70,
        hdl: Math.floor(Math.random() * 35) + 28,
        tg: Math.floor(Math.random() * 250) + 75,
        efTte: Math.floor(Math.random() * 35) + 30,
        typicalChestPain: Math.random() > 0.5 ? '1' : '0',
        stDepression: Math.random() > 0.6 ? '1' : '0',
        tinversion: Math.random() > 0.6 ? '1' : '0',
        dm: Math.random() > 0.7 ? 'Y' : 'N',
        htn: Math.random() > 0.6 ? 'Y' : 'N',
        currentSmoker: Math.random() > 0.7 ? 'Y' : 'N',
        regionRwma: Math.floor(Math.random() * 4),
      };
    });
  };

  const tabs: Array<{ id: CategoryTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'demographics', label: 'Demographics', icon: User },
    { id: 'vitals', label: 'Vitals & Load', icon: HeartPulse },
    { id: 'history', label: 'Medical History', icon: History },
    { id: 'symptoms', label: 'Angina Symptoms', icon: AlertCircle },
    { id: 'exam', label: 'Clinical Signs', icon: Stethoscope },
    { id: 'ecg', label: 'ECG Electrophys.', icon: Activity },
    { id: 'labs', label: 'Biomarkers & Labs', icon: TestTube },
    { id: 'echo', label: 'Echo & Segments', icon: Scan },
    { id: 'meds', label: 'Medications', icon: Pill },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/70 rounded-2xl border border-cyan-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.1)] overflow-hidden">
      {/* RPG Top Navigation Glyphs / Tab Icons (Hogwarts Legacy Style) */}
      <div className="relative border-b border-cyan-500/20 bg-slate-950/80 px-2 py-3">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 select-none group min-w-[76px] cursor-pointer relative ${
                  isActive
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 scale-110'
                      : 'bg-slate-900 text-slate-400 group-hover:scale-105 group-hover:text-cyan-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono tracking-tight text-center whitespace-nowrap uppercase">
                  {tab.label}
                </span>

                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Archetype Bar (Quick RPG Character Load) */}
      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Preset:
          </span>
          {archetypePresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadPreset(preset.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/60 border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Dice Randomizer & Reset Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleRandomize}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-all title='Randomize Patient Clinical Profile'"
            title="Randomize Profile"
          >
            <Dices className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPatient({ ...defaultBaselinePatient })}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
            title="Reset to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Parameter Form */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
        {/* TAB 1: DEMOGRAPHICS */}
        {activeTab === 'demographics' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Patient Anthropometrics
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                BMI: <strong className="text-cyan-300">{patient.bmi}</strong> kg/m²
              </span>
            </div>

            <RPGSlider
              id="age"
              label="Chronological Age"
              value={patient.age}
              min={25}
              max={90}
              unit="yrs"
              normalMin={25}
              normalMax={60}
              onChange={(v) => updateField('age', v)}
            />

            <RPGToggle
              id="sex"
              label="Biological Sex"
              value={patient.sex}
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
              ]}
              onChange={(v) => updateField('sex', v as 'Male' | 'Female')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGSlider
                id="weight"
                label="Body Weight"
                value={patient.weight}
                min={45}
                max={150}
                unit="kg"
                normalMin={50}
                normalMax={85}
                onChange={(v) => updateField('weight', v)}
              />
              <RPGSlider
                id="length"
                label="Height / Length"
                value={patient.length}
                min={135}
                max={195}
                unit="cm"
                onChange={(v) => updateField('length', v)}
              />
            </div>

            <RPGToggle
              id="obesity"
              label="Clinical Obesity (BMI ≥ 30)"
              value={patient.obesity}
              options={[
                { label: 'Non-Obese (N)', value: 'N' },
                { label: 'Obese (Y)', value: 'Y' },
              ]}
              onChange={(v) => updateField('obesity', v as 'Y' | 'N')}
              accentColor="amber"
            />
          </div>
        )}

        {/* TAB 2: VITALS & HEMODYNAMICS */}
        {activeTab === 'vitals' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Resting & Stress Hemodynamics
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Pulse: <strong className="text-emerald-400">{patient.pr}</strong> BPM
              </span>
            </div>

            <RPGSlider
              id="bp"
              label="Systolic Blood Pressure"
              value={patient.bp}
              min={90}
              max={210}
              unit="mmHg"
              normalMin={90}
              normalMax={120}
              onChange={(v) => updateField('bp', v)}
            />

            <RPGSlider
              id="pr"
              label="Resting Pulse Rate"
              value={patient.pr}
              min={45}
              max={130}
              unit="bpm"
              normalMin={60}
              normalMax={90}
              onChange={(v) => updateField('pr', v)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGSlider
                id="peakHr"
                label="Peak Stress HR"
                value={patient.peakHr}
                min={70}
                max={200}
                unit="bpm"
                onChange={(v) => updateField('peakHr', v)}
              />
              <RPGSlider
                id="peakBp"
                label="Peak Stress BP"
                value={patient.peakBp}
                min={100}
                max={240}
                unit="mmHg"
                onChange={(v) => updateField('peakBp', v)}
              />
            </div>

            <RPGSlider
              id="mets"
              label="Metabolic Equivalents (METS)"
              value={patient.mets}
              min={1.5}
              max={16.0}
              step={0.5}
              unit="METS"
              normalMin={7.0}
              normalMax={15.0}
              onChange={(v) => updateField('mets', v)}
            />
          </div>
        )}

        {/* TAB 3: MEDICAL HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Chronic Risk Conditions (Sani Cohort)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="dm"
                label="Diabetes Mellitus (DM)"
                value={patient.dm}
                options={[
                  { label: 'Non-Diabetic', value: 'N' },
                  { label: 'Diabetic (DM)', value: 'Y' },
                ]}
                onChange={(v) => updateField('dm', v as 'Y' | 'N')}
                accentColor="rose"
              />

              <RPGToggle
                id="htn"
                label="Hypertension (HTN)"
                value={patient.htn}
                options={[
                  { label: 'Normotensive', value: 'N' },
                  { label: 'Hypertensive', value: 'Y' },
                ]}
                onChange={(v) => updateField('htn', v as 'Y' | 'N')}
                accentColor="rose"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="currentSmoker"
                label="Current Tobacco Smoker"
                value={patient.currentSmoker}
                options={[
                  { label: 'Non-Smoker', value: 'N' },
                  { label: 'Smoker', value: 'Y' },
                ]}
                onChange={(v) => updateField('currentSmoker', v as 'Y' | 'N')}
                accentColor="rose"
              />

              <RPGToggle
                id="exSmoker"
                label="Past Ex-Smoker"
                value={patient.exSmoker}
                options={[
                  { label: 'No', value: 'N' },
                  { label: 'Ex-Smoker', value: 'Y' },
                ]}
                onChange={(v) => updateField('exSmoker', v as 'Y' | 'N')}
                accentColor="amber"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="fh"
                label="Family History of CAD (FH)"
                value={patient.fh}
                options={[
                  { label: 'Negative', value: 'N' },
                  { label: 'Positive FH', value: 'Y' },
                ]}
                onChange={(v) => updateField('fh', v as 'Y' | 'N')}
                accentColor="amber"
              />

              <RPGToggle
                id="dlp"
                label="Dyslipidemia (DLP)"
                value={patient.dlp}
                options={[
                  { label: 'Normolipid', value: 'N' },
                  { label: 'Dyslipidemic', value: 'Y' },
                ]}
                onChange={(v) => updateField('dlp', v as 'Y' | 'N')}
                accentColor="amber"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="crf"
                label="Chronic Renal Failure (CRF)"
                value={patient.crf}
                options={[
                  { label: 'Normal Renal', value: 'N' },
                  { label: 'CRF Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('crf', v as 'Y' | 'N')}
                accentColor="rose"
              />

              <RPGToggle
                id="cva"
                label="Cerebrovascular Event (CVA)"
                value={patient.cva}
                options={[
                  { label: 'No Stroke', value: 'N' },
                  { label: 'Past CVA', value: 'Y' },
                ]}
                onChange={(v) => updateField('cva', v as 'Y' | 'N')}
                accentColor="rose"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="chf"
                label="Congestive Heart Failure"
                value={patient.chf}
                options={[
                  { label: 'No CHF', value: 'N' },
                  { label: 'CHF Active', value: 'Y' },
                ]}
                onChange={(v) => updateField('chf', v as 'Y' | 'N')}
                accentColor="rose"
              />

              <RPGToggle
                id="airwayDisease"
                label="Airway Disease (COPD/Asthma)"
                value={patient.airwayDisease}
                options={[
                  { label: 'None', value: 'N' },
                  { label: 'COPD/Asthma', value: 'Y' },
                ]}
                onChange={(v) => updateField('airwayDisease', v as 'Y' | 'N')}
              />
            </div>
          </div>
        )}

        {/* TAB 4: SYMPTOMS & ANGINA */}
        {activeTab === 'symptoms' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Chest Discomfort & Angina Spectrum
              </span>
            </div>

            <RPGToggle
              id="typicalChestPain"
              label="Typical Angina (Crushing Substernal)"
              value={patient.typicalChestPain}
              options={[
                { label: 'Absent (0)', value: '0' },
                { label: 'Typical Angina (1)', value: '1' },
              ]}
              onChange={(v) => updateField('typicalChestPain', v as '0' | '1')}
              accentColor="rose"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="atypical"
                label="Atypical Chest Discomfort"
                value={patient.atypical}
                options={[
                  { label: 'Absent', value: 'N' },
                  { label: 'Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('atypical', v as 'Y' | 'N')}
                accentColor="amber"
              />

              <RPGToggle
                id="nonanginal"
                label="Non-Anginal Discomfort"
                value={patient.nonanginal}
                options={[
                  { label: 'Absent', value: 'N' },
                  { label: 'Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('nonanginal', v as 'Y' | 'N')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="exertionalCp"
                label="Exertional Chest Pain"
                value={patient.exertionalCp}
                options={[
                  { label: 'Rest / Non-Exert', value: 'N' },
                  { label: 'Exertion-Induced', value: 'Y' },
                ]}
                onChange={(v) => updateField('exertionalCp', v as 'Y' | 'N')}
                accentColor="amber"
              />

              <RPGToggle
                id="lowThAng"
                label="Low Threshold Angina"
                value={patient.lowThAng}
                options={[
                  { label: 'Normal Threshold', value: 'N' },
                  { label: 'Low Threshold', value: 'Y' },
                ]}
                onChange={(v) => updateField('lowThAng', v as 'Y' | 'N')}
                accentColor="rose"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="dyspnea"
                label="Dyspnea (Anginal Equivalent)"
                value={patient.dyspnea}
                options={[
                  { label: 'No Dyspnea', value: 'N' },
                  { label: 'Dyspnea Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('dyspnea', v as 'Y' | 'N')}
                accentColor="amber"
              />

              <RPGSlider
                id="functionClass"
                label="NYHA Functional Class (0 - 4)"
                value={patient.functionClass}
                min={0}
                max={4}
                step={1}
                ticks={5}
                onChange={(v) => updateField('functionClass', v)}
              />
            </div>
          </div>
        )}

        {/* TAB 5: CLINICAL EXAMINATION */}
        {activeTab === 'exam' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Physical Examination Signs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="edema"
                label="Peripheral Edema"
                value={patient.edema}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'Edema (1)', value: '1' },
                ]}
                onChange={(v) => updateField('edema', v as '0' | '1')}
                accentColor="amber"
              />

              <RPGToggle
                id="weakPeripheralPulse"
                label="Weak Peripheral Pulses"
                value={patient.weakPeripheralPulse}
                options={[
                  { label: 'Normal', value: 'N' },
                  { label: 'Diminished', value: 'Y' },
                ]}
                onChange={(v) => updateField('weakPeripheralPulse', v as 'Y' | 'N')}
                accentColor="rose"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="lungRales"
                label="Pulmonary Lung Rales / Crackles"
                value={patient.lungRales}
                options={[
                  { label: 'Clear Bases', value: 'N' },
                  { label: 'Rales Audible', value: 'Y' },
                ]}
                onChange={(v) => updateField('lungRales', v as 'Y' | 'N')}
                accentColor="rose"
              />

              <RPGToggle
                id="systolicMurmur"
                label="Systolic Murmur"
                value={patient.systolicMurmur}
                options={[
                  { label: 'No Murmur', value: 'N' },
                  { label: 'Systolic Murmur', value: 'Y' },
                ]}
                onChange={(v) => updateField('systolicMurmur', v as 'Y' | 'N')}
                accentColor="amber"
              />
            </div>

            <RPGToggle
              id="diastolicMurmur"
              label="Diastolic Murmur"
              value={patient.diastolicMurmur}
              options={[
                { label: 'No Murmur', value: 'N' },
                { label: 'Diastolic Murmur', value: 'Y' },
              ]}
              onChange={(v) => updateField('diastolicMurmur', v as 'Y' | 'N')}
              accentColor="rose"
            />
          </div>
        )}

        {/* TAB 6: ECG & ELECTROPHYSIOLOGY */}
        {activeTab === 'ecg' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                12-Lead Electrocardiography
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="stElevation"
                label="ST Segment Elevation (Transmural)"
                value={patient.stElevation}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'ST Elevation (1)', value: '1' },
                ]}
                onChange={(v) => updateField('stElevation', v as '0' | '1')}
                accentColor="rose"
              />

              <RPGToggle
                id="stDepression"
                label="ST Segment Depression"
                value={patient.stDepression}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'ST Depression (1)', value: '1' },
                ]}
                onChange={(v) => updateField('stDepression', v as '0' | '1')}
                accentColor="rose"
              />
            </div>

            {patient.stDepression === '1' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-amber-500/30">
                <RPGSlider
                  id="stDep"
                  label="ST Depression Depth"
                  value={patient.stDep}
                  min={0.5}
                  max={4.5}
                  step={0.5}
                  unit="mm"
                  onChange={(v) => updateField('stDep', v)}
                />
                <RPGSlider
                  id="stDepLeadNumber"
                  label="ST Depression Lead Count"
                  value={patient.stDepLeadNumber}
                  min={1}
                  max={6}
                  step={1}
                  ticks={6}
                  unit="leads"
                  onChange={(v) => updateField('stDepLeadNumber', v)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="tinversion"
                label="T-Wave Inversion"
                value={patient.tinversion}
                options={[
                  { label: 'Normal Upright (0)', value: '0' },
                  { label: 'T Inversion (1)', value: '1' },
                ]}
                onChange={(v) => updateField('tinversion', v as '0' | '1')}
                accentColor="amber"
              />

              <RPGToggle
                id="qWave"
                label="Pathological Q-Wave"
                value={patient.qWave}
                options={[
                  { label: 'Absent (0)', value: '0' },
                  { label: 'Q-Wave (1)', value: '1' },
                ]}
                onChange={(v) => updateField('qWave', v as '0' | '1')}
                accentColor="rose"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="bbb"
                label="Bundle Branch Block (BBB)"
                value={patient.bbb}
                options={[
                  { label: 'None (N)', value: 'N' },
                  { label: 'LBBB', value: 'LBBB' },
                ]}
                onChange={(v) => updateField('bbb', v as 'N' | 'LBBB' | 'RBBB')}
                accentColor="rose"
              />

              <RPGToggle
                id="lvh"
                label="Left Ventricular Hypertrophy"
                value={patient.lvh}
                options={[
                  { label: 'Absent', value: 'N' },
                  { label: 'LVH Present', value: 'Y' },
                ]}
                onChange={(v) => updateField('lvh', v as 'Y' | 'N')}
                accentColor="amber"
              />
            </div>
          </div>
        )}

        {/* TAB 7: LABS & BIOMARKERS */}
        {activeTab === 'labs' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Metabolic & Inflammatory Biomarkers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGSlider
                id="fbs"
                label="Fasting Blood Sugar (FBS)"
                value={patient.fbs}
                min={65}
                max={380}
                unit="mg/dL"
                normalMin={70}
                normalMax={100}
                onChange={(v) => updateField('fbs', v)}
              />
              <RPGSlider
                id="a1c"
                label="HbA1c Glycated Hgb"
                value={patient.a1c}
                min={4.5}
                max={13.5}
                step={0.1}
                unit="%"
                normalMin={4.5}
                normalMax={5.7}
                onChange={(v) => updateField('a1c', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGSlider
                id="ldl"
                label="Atherogenic LDL Cholesterol"
                value={patient.ldl}
                min={30}
                max={260}
                unit="mg/dL"
                normalMin={40}
                normalMax={100}
                onChange={(v) => updateField('ldl', v)}
              />
              <RPGSlider
                id="hdl"
                label="Cardioprotective HDL"
                value={patient.hdl}
                min={15}
                max={85}
                unit="mg/dL"
                normalMin={40}
                normalMax={75}
                onChange={(v) => updateField('hdl', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGSlider
                id="tg"
                label="Serum Triglycerides (TG)"
                value={patient.tg}
                min={40}
                max={600}
                unit="mg/dL"
                normalMin={50}
                normalMax={150}
                onChange={(v) => updateField('tg', v)}
              />
              <RPGSlider
                id="cr"
                label="Serum Creatinine"
                value={patient.cr}
                min={0.5}
                max={4.0}
                step={0.1}
                unit="mg/dL"
                normalMin={0.6}
                normalMax={1.2}
                onChange={(v) => updateField('cr', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGSlider
                id="esr"
                label="Erythrocyte Sed Rate (ESR)"
                value={patient.esr}
                min={2}
                max={90}
                unit="mm/hr"
                normalMin={0}
                normalMax={20}
                onChange={(v) => updateField('esr', v)}
              />
              <RPGSlider
                id="crp"
                label="hs-CRP Inflammatory"
                value={patient.crp}
                min={0.2}
                max={20.0}
                step={0.2}
                unit="mg/L"
                normalMin={0.1}
                normalMax={3.0}
                onChange={(v) => updateField('crp', v)}
              />
            </div>
          </div>
        )}

        {/* TAB 8: ECHO & CORONARY SEGMENTS */}
        {activeTab === 'echo' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Echocardiography & Coronary Segments
              </span>
            </div>

            <RPGSlider
              id="efTte"
              label="Ejection Fraction (EF-TTE)"
              value={patient.efTte}
              min={15}
              max={65}
              unit="%"
              normalMin={50}
              normalMax={65}
              onChange={(v) => updateField('efTte', v)}
            />

            <RPGSlider
              id="regionRwma"
              label="Regional Wall Motion (RWMA Score)"
              value={patient.regionRwma}
              min={0}
              max={4}
              step={1}
              ticks={5}
              unit="/4"
              onChange={(v) => updateField('regionRwma', v)}
            />

            <RPGToggle
              id="vhd"
              label="Valvular Heart Disease (VHD)"
              value={patient.vhd}
              options={[
                { label: 'None (N)', value: 'N' },
                { label: 'Mild', value: 'mild' },
              ]}
              onChange={(v) => updateField('vhd', v as 'N' | 'mild' | 'Moderate' | 'Severe')}
              accentColor="amber"
            />

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase block mb-2">
                Coronary Angiography Findings (Target Vessels)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <RPGToggle
                  id="lad"
                  label="LAD Proximal"
                  value={patient.ladProximal}
                  options={[
                    { label: 'Normal', value: 'Normal' },
                    { label: 'Stenotic', value: 'Stenotic' },
                  ]}
                  onChange={(v) => updateField('ladProximal', v as 'Normal' | 'Stenotic')}
                  accentColor="rose"
                />

                <RPGToggle
                  id="lcx"
                  label="LCX Circumflex"
                  value={patient.lcxProximal}
                  options={[
                    { label: 'Normal', value: 'Normal' },
                    { label: 'Stenotic', value: 'Stenotic' },
                  ]}
                  onChange={(v) => updateField('lcxProximal', v as 'Normal' | 'Stenotic')}
                  accentColor="amber"
                />

                <RPGToggle
                  id="rca"
                  label="RCA Right Cor."
                  value={patient.rcaProximal}
                  options={[
                    { label: 'Normal', value: 'Normal' },
                    { label: 'Stenotic', value: 'Stenotic' },
                  ]}
                  onChange={(v) => updateField('rcaProximal', v as 'Normal' | 'Stenotic')}
                  accentColor="rose"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: MEDICATIONS */}
        {activeTab === 'meds' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Active Pharmacotherapy Baseline
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="statin"
                label="HMG-CoA Statin"
                value={patient.statin}
                options={[
                  { label: 'No Statin', value: 'N' },
                  { label: 'On Statin', value: 'Y' },
                ]}
                onChange={(v) => updateField('statin', v as 'Y' | 'N')}
                accentColor="emerald"
              />

              <RPGToggle
                id="asa"
                label="Aspirin (ASA)"
                value={patient.asa}
                options={[
                  { label: 'No ASA', value: 'N' },
                  { label: 'On Aspirin', value: 'Y' },
                ]}
                onChange={(v) => updateField('asa', v as 'Y' | 'N')}
                accentColor="emerald"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="betaBlocker"
                label="Beta Blocker"
                value={patient.betaBlocker}
                options={[
                  { label: 'None', value: 'N' },
                  { label: 'Active', value: 'Y' },
                ]}
                onChange={(v) => updateField('betaBlocker', v as 'Y' | 'N')}
                accentColor="cyan"
              />

              <RPGToggle
                id="nitrat"
                label="Nitrates (Vasodilator)"
                value={patient.nitrat}
                options={[
                  { label: 'None', value: 'N' },
                  { label: 'Prescribed', value: 'Y' },
                ]}
                onChange={(v) => updateField('nitrat', v as 'Y' | 'N')}
                accentColor="amber"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RPGToggle
                id="plavix"
                label="Clopidogrel (Plavix)"
                value={patient.plavix}
                options={[
                  { label: 'None', value: 'N' },
                  { label: 'Active', value: 'Y' },
                ]}
                onChange={(v) => updateField('plavix', v as 'Y' | 'N')}
                accentColor="cyan"
              />

              <RPGToggle
                id="ace"
                label="ACE Inhibitor / ARB"
                value={patient.ace}
                options={[
                  { label: 'None', value: 'N' },
                  { label: 'Active', value: 'Y' },
                ]}
                onChange={(v) => updateField('ace', v as 'Y' | 'N')}
                accentColor="cyan"
              />
            </div>
          </div>
        )}
      </div>

      {/* Prominent "Run Predictive Simulation" Button (Requirement 2) */}
      <div className="p-4 border-t border-cyan-500/20 bg-slate-950/90 backdrop-blur-md">
        <button
          type="button"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={`w-full py-4 px-6 rounded-xl font-mono text-sm tracking-widest uppercase font-bold transition-all duration-300 flex items-center justify-center gap-3 relative group overflow-hidden cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_45px_rgba(6,182,212,0.7)] ${
            isSimulating
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 hover:scale-[1.01]'
          }`}
        >
          {/* Animated Glow Sheen */}
          <div className="absolute inset-0 bg-white/25 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

          {isSimulating ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
              <span>Synthesizing Coronary Risk Vector...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-125" />
              <span>Run Predictive Simulation</span>
              <Sparkles className="w-4 h-4 text-slate-950/80" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
