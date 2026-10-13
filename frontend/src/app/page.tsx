'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { HogwartsHeaderNav, MainCategoryTab } from '../components/HogwartsHeaderNav';
import { CleanParameterPanel } from '../components/CleanParameterPanel';
import { HeartCanvas3D } from '../components/HeartCanvas3D';
import { PredictionResultsHUD } from '../components/PredictionResultsHUD';
import { ControllerFooter } from '../components/ControllerFooter';
import { PatientClinicalData, PredictionResult } from '../types/medical';
import { defaultBaselinePatient, archetypePresets } from '../data/patientArchetypes';
import { runCadMLInference, checkApiHealth } from '../utils/cadPredictor';

export default function Home() {
  // Step 1: Mandatory Disclaimer Modal state (defaults to open on initial load)
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState<boolean>(false);

  // Patient Clinical Parameters State
  const [patient, setPatient] = useState<PatientClinicalData>(defaultBaselinePatient);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('healthy-control');

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<MainCategoryTab>('demographics');
  const mainTabs: MainCategoryTab[] = ['demographics', 'vitals', 'labs', 'ecg'];

  // Prediction State
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showResultsHUD, setShowResultsHUD] = useState<boolean>(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Check initial disclaimer acceptance from session
  useEffect(() => {
    const accepted = sessionStorage.getItem('corvita_disclaimer_accepted');
    if (accepted === 'true') {
      setShowDisclaimer(false);
      setHasAcceptedDisclaimer(true);
    }
    // Check ML API health
    checkApiHealth().then(online => setApiOnline(online));
  }, []);

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    setHasAcceptedDisclaimer(true);
    sessionStorage.setItem('corvita_disclaimer_accepted', 'true');
  };

  // Run ML Predictive Simulation (async, calls FastAPI backend)
  const handleRunSimulation = async () => {
    setIsSimulating(true);

    try {
      const result = await runCadMLInference(patient);
      setPrediction(result);
      setShowResultsHUD(true);

      if (result.overallRiskScore < 25) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#d97706'],
        });
      }
    } catch (err) {
      console.error('[CorVita] Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Preset loading
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

  // Randomize parameters
  const handleRandomize = () => {
    setPatient((prev) => {
      const randomAge = Math.floor(Math.random() * 45) + 38;
      const randomSex = Math.random() > 0.45 ? 'Male' : 'Female';
      const randomWeight = Math.floor(Math.random() * 40) + 55;
      const randomLength = Math.floor(Math.random() * 25) + 152;
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
        bp: Math.floor(Math.random() * 55) + 110,
        pr: Math.floor(Math.random() * 35) + 62,
        peakHr: Math.floor(Math.random() * 50) + 125,
        fbs: Math.floor(Math.random() * 140) + 85,
        ldl: Math.floor(Math.random() * 100) + 80,
        hdl: Math.floor(Math.random() * 30) + 32,
        tg: Math.floor(Math.random() * 220) + 80,
        efTte: Math.floor(Math.random() * 30) + 35,
        typicalChestPain: Math.random() > 0.55 ? '1' : '0',
        stDepression: Math.random() > 0.65 ? '1' : '0',
        tinversion: Math.random() > 0.65 ? '1' : '0',
        dm: Math.random() > 0.7 ? 'Y' : 'N',
        htn: Math.random() > 0.6 ? 'Y' : 'N',
        currentSmoker: Math.random() > 0.75 ? 'Y' : 'N',
        regionRwma: Math.floor(Math.random() * 3.5),
      };
    });
  };

  // Controller / Hotkey tab cycling (L1 / R1)
  const handleNextTab = () => {
    const idx = mainTabs.indexOf(activeTab);
    setActiveTab(mainTabs[(idx + 1) % mainTabs.length]);
  };

  const handlePrevTab = () => {
    const idx = mainTabs.indexOf(activeTab);
    setActiveTab(mainTabs[(idx - 1 + mainTabs.length) % mainTabs.length]);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#080B10] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
      {/* Hogwarts Legacy Subtle Radial Vignette Background */}
      <div className="fixed inset-0 rpg-vignette pointer-events-none z-0" />

      {/* ML Engine Status Badge */}
      {apiOnline !== null && (
        <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wide backdrop-blur-md transition-all duration-700 ${
          apiOnline
            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
        }`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
            apiOnline ? 'bg-emerald-400' : 'bg-amber-400'
          }`} />
          {apiOnline ? 'ML ENGINE ONLINE' : 'ML ENGINE OFFLINE — FALLBACK'}
        </div>
      )}

      {/* Mandatory Disclaimer Modal Overlay (Step 1) */}
      <DisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {/* Top Header & Hogwarts Legacy Category Bar */}
      <HogwartsHeaderNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onPrevTab={handlePrevTab}
        onNextTab={handleNextTab}
        onOpenDisclaimer={() => setShowDisclaimer(true)}
        onLoadPreset={handleLoadPreset}
        onRandomize={handleRandomize}
        onReset={() => setPatient({ ...defaultBaselinePatient })}
        selectedPresetId={selectedPresetId}
      />

      {/* Main Split Layout: Floating Left Panel (~38%) and Open 3D Canvas (~62%) */}
      <main className="relative z-10 flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-5 items-stretch overflow-hidden">
        {/* LEFT FLOATING PANEL (Width: ~38%): Clean Sterile Form Controls */}
        <section className="w-full lg:w-[38%] xl:w-[36%] flex flex-col h-[650px] lg:h-[calc(100vh-140px)] min-h-[580px]">
          <CleanParameterPanel
            patient={patient}
            setPatient={setPatient}
            activeTab={activeTab}
            onRunSimulation={handleRunSimulation}
            isSimulating={isSimulating}
          />
        </section>

        {/* RIGHT OPEN CANVAS (Width: ~62%): 3D Viewer & Hemodynamic Perfusion */}
        <section className="w-full lg:w-[62%] xl:w-[64%] flex flex-col h-[650px] lg:h-[calc(100vh-140px)] min-h-[580px]">
          <HeartCanvas3D
            patient={patient}
            prediction={prediction}
            isSimulating={isSimulating}
          />
        </section>
      </main>

      {/* Diagnostic Synthesis Report Modal */}
      <PredictionResultsHUD
        prediction={prediction}
        isOpen={showResultsHUD}
        onClose={() => setShowResultsHUD(false)}
      />

      {/* Bottom Console Gamepad Hints & Understated Disclaimer */}
      <ControllerFooter
        onRunSimulation={handleRunSimulation}
        onRandomize={handleRandomize}
        onReset={() => setPatient({ ...defaultBaselinePatient })}
        onOpenDisclaimer={() => setShowDisclaimer(true)}
      />
    </div>
  );
}
