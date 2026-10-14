'use client';

import * as React from 'react';
import { User, Heart, TestTube, Activity, ShieldAlert, RotateCcw, Dices, ChevronDown, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { archetypePresets } from '@/data/patientArchetypes';

export type MainCategoryTab = 'demographics' | 'vitals' | 'labs' | 'ecg';

interface HogwartsHeaderNavProps {
  activeTab: MainCategoryTab;
  onSelectTab: (tab: MainCategoryTab) => void;
  onPrevTab: () => void;
  onNextTab: () => void;
  onOpenDisclaimer: () => void;
  onLoadPreset: (presetId: string) => void;
  onRandomize: () => void;
  onReset: () => void;
  selectedPresetId?: string;
}

export const HogwartsHeaderNav: React.FC<HogwartsHeaderNavProps> = ({
  activeTab,
  onSelectTab,
  onPrevTab,
  onNextTab,
  onOpenDisclaimer,
  onLoadPreset,
  onRandomize,
  onReset,
  selectedPresetId,
}) => {

  const tabs: Array<{ id: MainCategoryTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'demographics', label: 'Demographics', icon: User },
    { id: 'vitals', label: 'Vitals & Symptoms', icon: Heart },
    { id: 'labs', label: 'Lab & Biomarkers', icon: TestTube },
    { id: 'ecg', label: 'ECG / Echo Findings', icon: Activity },
  ];


  return (
    <header className="relative w-full z-30 pt-3 pb-2.5 px-4 sm:px-6 xl:px-8 flex items-center justify-between gap-4 border-b border-[rgba(255,49,88,0.35)] bg-[#080A14]/85 backdrop-blur-xl select-none overflow-hidden shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">


      {/* Brand title */}
      <div className="flex items-center relative z-10 shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none whitespace-nowrap">
            <span className="font-sans tracking-wider text-xs sm:text-sm uppercase text-[#FF3158] font-black drop-shadow-[0_0_10px_rgba(255,49,88,0.5)]">
              CORONARY
            </span>
            <span className="font-sans tracking-wider text-xs sm:text-sm uppercase text-[#F4F6FF] font-black">
              ASSESSMENT SIMULATOR
            </span>
          </div>
          <span className="text-[10px] text-[#A9BED8] font-sans tracking-wide block mt-1 whitespace-nowrap">
            Z-Alizadeh Sani Cohort Analysis
          </span>
        </div>
      </div>

      {/* Center: L1 / Category Icons / R1 bar */}
      <div className="hidden md:flex items-center gap-2 sm:gap-3 select-none relative z-10 shrink-0">
        {/* L1 Controller Prompt */}
        <button
          type="button"
          onClick={onPrevTab}
          className="btn-corvita btn-sm font-mono flex items-center gap-1"
          title="Previous Category (L1)"
        >
          <span>L1</span>
        </button>

        {/* Categories Floating Glass Capsule */}
        <div className="relative flex items-center gap-2 sm:gap-3 bg-[rgba(12,19,35,0.88)] backdrop-blur-xl px-3 py-1.5 rounded-full border border-[rgba(145,173,221,0.30)] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.22)]">
          {/* Subtle cyan reflection on the right of the glass capsule */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 rounded-r-full bg-gradient-to-l from-[#83DDF3]/15 to-transparent pointer-events-none" />

          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
                {idx > 0 && <span className="w-1 h-1 rounded-full bg-[rgba(145,173,221,0.25)]" />}
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={cn(
                    'relative flex items-center justify-center p-2 rounded-full transition-all duration-200 cursor-pointer group',
                    isActive
                      ? 'text-white'
                      : 'text-[#70849F] hover:text-[#F4F6FF]'
                  )}
                  title={tab.label}
                >
                  {/* Glowing Red Solid Gradient on Active Tab */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border border-[rgba(255,255,255,0.6)] shadow-[0_0_16px_rgba(255,49,88,0.7),0_0_20px_rgba(255,49,88,0.45),inset_0_1px_0_rgba(255,255,255,0.65)] bg-gradient-to-tr from-[#FF536B] via-[#FF3158] to-[#C41838]" />
                  )}
                  <Icon className={cn('w-4 h-4 relative z-10 transition-transform', isActive && 'scale-110 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]')} />
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNextTab}
          className="btn-corvita btn-sm font-mono flex items-center gap-1"
          title="Next Category (R1)"
        >
          <span>R1</span>
        </button>
      </div>

      {/* Right: Clean Utility Actions (Presets dropdown / Copy / Reset / Disclaimer) */}
      <div className="flex items-center gap-1.5 sm:gap-2 relative z-10 shrink-0">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-[rgba(25,38,62,0.68)] backdrop-blur-md border border-[rgba(145,173,221,0.26)] hover:border-[#FF3158]/50 rounded-lg px-2.5 py-1 text-xs transition-all whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]">
          <Network className="w-3.5 h-3.5 text-[#FF3158] shrink-0 drop-shadow-[0_0_6px_rgba(255,49,88,0.6)]" />
          <span className="hidden lg:inline text-[10px] uppercase font-sans font-bold text-[#A9BED8] tracking-wider">PRESET:</span>
          <div className="relative flex items-center">
            <select
              value={selectedPresetId || 'healthy-control'}
              onChange={(e) => onLoadPreset(e.target.value)}
              className="bg-transparent text-[#FF536B] font-semibold text-xs border-none focus:outline-none cursor-pointer pr-4 appearance-none font-sans max-w-[130px] sm:max-w-none"
            >
              {archetypePresets.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#080A14] text-[#F4F6FF]">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#A9BED8] pointer-events-none absolute right-0" />
          </div>
        </div>

        {/* Randomise Button */}
        <button
          type="button"
          onClick={onRandomize}
          className="btn-corvita btn-icon"
          title="Randomize Patient Profile"
        >
          <Dices className="w-3.5 h-3.5" />
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className="btn-corvita btn-icon"
          title="Reset to Baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Disclaimer Button */}
        <button
          type="button"
          onClick={onOpenDisclaimer}
          className="btn-corvita btn-sm shrink-0"
          title="View Medical Disclaimer"
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] font-sans font-medium">Disclaimer</span>
        </button>
      </div>
    </header>
  );
};

