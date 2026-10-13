'use client';

import * as React from 'react';
import { User, HeartPulse, TestTube, Activity, ShieldAlert, Sparkles, Dices, RotateCcw } from 'lucide-react';
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
    { id: 'vitals', label: 'Vitals & Symptoms', icon: HeartPulse },
    { id: 'labs', label: 'Lab & Biomarkers', icon: TestTube },
    { id: 'ecg', label: 'ECG / Echo Findings', icon: Activity },
  ];

  return (
    <header className="relative w-full z-30 pt-4 pb-2 px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-amber-500/10 bg-[#080B10]/90 backdrop-blur-md">
      {/* Brand title - Subtle and refined */}
      <div className="flex items-center gap-3">
        <div>
          <span className="font-serif tracking-widest text-xs uppercase text-amber-200/90 font-semibold block">
            Coronary Assessment Simulator
          </span>
          <span className="text-[10px] text-slate-500 font-sans tracking-wide">
            Z-Alizadeh Sani Cohort Analysis
          </span>
        </div>
      </div>

      {/* Center: Hogwarts Legacy L1 / Category Icons / R1 bar */}
      <div className="flex items-center gap-2 sm:gap-4 select-none">
        {/* L1 Controller Prompt */}
        <button
          type="button"
          onClick={onPrevTab}
          className="h-7 px-2 rounded border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-amber-200 hover:border-amber-500/40 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
          title="Previous Category (L1)"
        >
          <span>L1</span>
        </button>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[#0B0F17]/90 px-3 py-1.5 rounded-full border border-slate-800/80 shadow-inner">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
                {idx > 0 && <span className="w-1 h-1 rounded-full bg-slate-800" />}
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={cn(
                    'relative flex items-center justify-center p-2 rounded-full transition-all duration-300 cursor-pointer group',
                    isActive
                      ? 'text-amber-200'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                  title={tab.label}
                >
                  {/* Hogwarts Legacy Glowing Gold Ring on Active Tab */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.35)] bg-amber-400/10 animate-pulse" />
                  )}
                  <Icon className={cn('w-4 h-4 relative z-10 transition-transform', isActive && 'scale-110')} />
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* R1 Controller Prompt */}
        <button
          type="button"
          onClick={onNextTab}
          className="h-7 px-2 rounded border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-amber-200 hover:border-amber-500/40 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
          title="Next Category (R1)"
        >
          <span>R1</span>
        </button>
      </div>

      {/* Right: Clean Utility Actions (Presets dropdown / Randomize / Disclaimer) */}
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] uppercase font-serif text-slate-400">Preset:</span>
          <select
            value={selectedPresetId || 'healthy-control'}
            onChange={(e) => onLoadPreset(e.target.value)}
            className="bg-transparent text-amber-200 text-xs border-none focus:outline-none cursor-pointer font-sans"
          >
            {archetypePresets.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRandomize}
          className="h-8 w-8 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-200 flex items-center justify-center transition-colors cursor-pointer"
          title="Randomize Parameters"
        >
          <Dices className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onReset}
          className="h-8 w-8 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-200 flex items-center justify-center transition-colors cursor-pointer"
          title="Reset to Baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenDisclaimer}
          className="h-8 px-2.5 rounded border border-slate-800 bg-slate-900/60 hover:bg-amber-950/30 hover:border-amber-500/40 text-slate-400 hover:text-amber-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="View Medical Disclaimer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline text-[11px] font-sans">Disclaimer</span>
        </button>
      </div>
    </header>
  );
};
