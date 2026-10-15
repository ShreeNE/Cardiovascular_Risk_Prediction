'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { HogwartsHeaderNav, MainCategoryTab } from '../components/HogwartsHeaderNav';
import { CleanParameterPanel } from '../components/CleanParameterPanel';
import { PredictionInlinePanel } from '../components/PredictionInlinePanel';
import { HeartCanvas3D } from '../components/HeartCanvas3D';
import { PatientClinicalData, PredictionResult } from '../types/medical';
import { defaultBaselinePatient, archetypePresets } from '../data/patientArchetypes';
import { runCadMLInference } from '../utils/cadPredictor';
import { LiquidShaderBackground } from '../components/LiquidShaderBackground';

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

  // Check initial disclaimer acceptance from session
  useEffect(() => {
    const accepted = sessionStorage.getItem('corvita_disclaimer_accepted');
    if (accepted === 'true') {
      setShowDisclaimer(false);
      setHasAcceptedDisclaimer(true);
    }
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

      if (result.overallRiskScore < 25) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F04452', '#FF5964', '#651E2B'],
        });
      }
    } catch (err) {
      console.error('[CorVita] Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset everything back to baseline
  const handleFullReset = () => {
    setPrediction(null);
    setPatient({ ...defaultBaselinePatient });
    setSelectedPresetId('healthy-control');
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
    <div className="relative min-h-screen w-full flex flex-col bg-[#04070D] text-[#F1F5FA] font-sans selection:bg-[#FF334F]/30 selection:text-white overflow-x-hidden">
      {/* Subtle Cardiovascular Radial Vignette Background & Ambient Glows */}
      <div className="fixed inset-0 cardio-vignette pointer-events-none z-0" />
      <div className="fixed -bottom-48 -right-48 w-96 h-96 rounded-full bg-[#FF334F]/5 blur-3xl pointer-events-none z-0" />
      <div className="fixed -top-48 -left-48 w-96 h-96 rounded-full bg-[#83DDF3]/5 blur-3xl pointer-events-none z-0" />

      {/* Mandatory Disclaimer Modal Overlay (Step 1) */}
      <DisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {/* Top Header & Category Bar */}
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
      <main className="relative z-10 flex-1 w-full max-w-[1920px] mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch min-h-0">
        {/* LEFT FLOATING PANEL: parameter inputs OR prediction results */}
        <section className="relative w-full lg:w-[38%] xl:w-[36%] flex flex-col h-[680px] lg:h-[calc(100vh-110px)] min-h-[580px] rounded-2xl overflow-hidden">
          {/* Liquid Shader Background — restricted behind left panel only */}
          <LiquidShaderBackground />
          <div className="relative z-10 flex flex-col h-full">
            {prediction && !isSimulating ? (
              <PredictionInlinePanel
                prediction={prediction}
                patient={patient}
                onReset={handleFullReset}
                onRunAgain={handleRunSimulation}
                isSimulating={isSimulating}
              />
            ) : (
              <CleanParameterPanel
                patient={patient}
                setPatient={setPatient}
                activeTab={activeTab}
                onRunSimulation={handleRunSimulation}
                isSimulating={isSimulating}
              />
            )}
          </div>
        </section>

        {/* RIGHT OPEN CANVAS (Width: ~62%): 3D Viewer & Hemodynamic Perfusion */}
        <section className="w-full lg:w-[62%] xl:w-[64%] flex flex-col h-[680px] lg:h-[calc(100vh-110px)] min-h-[580px]">
          <HeartCanvas3D
            patient={patient}
            prediction={prediction}
            isSimulating={isSimulating}
          />
        </section>
      </main>
    </div>
  );
}
