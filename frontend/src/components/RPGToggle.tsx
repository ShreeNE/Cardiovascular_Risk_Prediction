'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { medicalDictionary } from '../data/medicalDictionary';

interface RPGToggleProps {
  id: string;
  label: string;
  value: string;
  options: Array<{
    label: string;
    value: string;
    badge?: string;
  }>;
  onChange: (val: string) => void;
  accentColor?: 'cyan' | 'amber' | 'rose' | 'emerald';
}

export const RPGToggle: React.FC<RPGToggleProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  accentColor = 'cyan',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const termInfo = medicalDictionary[id];

  const getActiveStyle = (isActive: boolean) => {
    if (!isActive) {
      return 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200';
    }

    switch (accentColor) {
      case 'rose':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
      case 'amber':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'emerald':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      case 'cyan':
      default:
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl p-3 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs uppercase tracking-wider font-semibold font-mono text-slate-300">
            {label}
          </span>
          {termInfo && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/60 transition-colors"
                title="Medical Definition"
              >
                <Info className="w-3 h-3" />
              </button>

              {showTooltip && (
                <div className="absolute left-0 bottom-6 z-40 w-64 p-3 bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md text-xs text-slate-200 pointer-events-none font-sans">
                  <div className="font-semibold text-cyan-400 font-mono mb-1">{termInfo.name}</div>
                  <div className="text-[11px] text-slate-400 mb-1.5">{termInfo.definition}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-500 font-mono">Reference:</span>
                    <span className="text-emerald-400 font-mono">{termInfo.normalRange}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Segmented Button Matrix */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden ${getActiveStyle(
                isActive
              )}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-current animate-pulse' : 'bg-slate-700'}`} />
              <span>{opt.label}</span>
              {opt.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-400">
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
