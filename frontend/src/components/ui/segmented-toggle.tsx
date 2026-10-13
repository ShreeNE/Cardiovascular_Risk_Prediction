'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { medicalDictionary } from '@/data/medicalDictionary';

interface SegmentedToggleProps {
  id: string;
  label: string;
  value: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  onChange: (val: string) => void;
  className?: string;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  className,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const termInfo = medicalDictionary[id];

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 transition-colors hover:border-slate-700/90',
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-300 font-sans">
            {label}
          </span>
          {termInfo && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-500 hover:text-amber-300 transition-colors cursor-pointer"
                title="Clinical Definition"
              >
                <Info className="w-3 h-3" />
              </button>

              {showTooltip && (
                <div className="absolute left-0 bottom-5 z-50 w-64 rounded-md border border-amber-500/30 bg-[#0B0F17]/95 p-2.5 shadow-xl backdrop-blur-md text-[11px] text-slate-200 pointer-events-none font-sans">
                  <div className="font-semibold text-amber-200 font-serif mb-0.5">{termInfo.name}</div>
                  <div className="text-[10px] text-slate-400 mb-1 leading-relaxed">{termInfo.definition}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9px] font-mono">
                    <span className="text-slate-500">Normal State:</span>
                    <span className="text-amber-300">{termInfo.normalRange}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dual-state segmented button toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'h-8 rounded border px-2.5 text-xs font-medium transition-all duration-150 flex items-center justify-center cursor-pointer select-none',
                isActive
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
