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
        'glass-card rounded-xl p-3 transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-[#F1F5FA] font-sans">
            {label}
          </span>
          {termInfo && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-[#A3B5C9] hover:text-[#FF334F] transition-colors cursor-pointer"
                title="Clinical Definition"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {showTooltip && (
                <div className="absolute left-0 bottom-5 z-50 w-64 rounded-xl border border-[rgba(174,198,225,0.25)] bg-[rgba(8,14,24,0.96)] p-3 shadow-2xl backdrop-blur-xl text-[11px] text-[#F1F5FA] pointer-events-none font-sans">
                  <div className="font-semibold text-[#FF334F] font-serif mb-0.5">{termInfo.name}</div>
                  <div className="text-[10px] text-[#A3B5C9] mb-1.5 leading-relaxed">{termInfo.definition}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-[rgba(174,198,225,0.18)] text-[9px] font-mono">
                    <span className="text-[#A3B5C9]">Normal State:</span>
                    <span className="text-[#83DDF3]">{termInfo.normalRange}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dual-state segmented button toggle */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'h-9 rounded-lg px-3 text-xs font-medium transition-all duration-150 flex items-center justify-center cursor-pointer select-none',
                isActive
                  ? 'btn-corvita-selected font-semibold'
                  : 'btn-corvita-ghost font-medium'
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
