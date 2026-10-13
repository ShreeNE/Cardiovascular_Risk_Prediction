'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { medicalDictionary } from '@/data/medicalDictionary';

interface RpgOrnamentSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ticks?: number;
  onChange: (val: number) => void;
  className?: string;
}

export const RpgOrnamentSlider: React.FC<RpgOrnamentSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  ticks = 7,
  onChange,
  className,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const termInfo = medicalDictionary[id];

  const handleDecrement = () => {
    const newVal = Math.max(min, Number((value - step).toFixed(2)));
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.min(max, Number((value + step).toFixed(2)));
    onChange(newVal);
  };

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={cn('space-y-2 py-1', className)}>
      {/* Heading matching Hogwarts Legacy styling */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-serif tracking-widest text-xs uppercase text-amber-100/80">
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
                    <span className="text-slate-500">Normal Range:</span>
                    <span className="text-amber-300">{termInfo.normalRange}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-xs font-mono font-medium text-amber-300/90">
          {value} {unit}
        </span>
      </div>

      {/* Hogwarts Legacy Slider: (<) ---o--- (>) */}
      <div className="flex items-center gap-3">
        {/* Left Ornamental Bracket Arrow */}
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Decrease ${label}`}
          className="h-6 w-6 rounded-full border border-amber-500/40 bg-slate-900/80 text-amber-300 hover:border-amber-400 hover:bg-amber-950/40 hover:text-amber-100 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.15)]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Minimal Horizontal Line Track with Pips and Gold Ring */}
        <div className="relative flex-1 py-3 flex items-center">
          {/* Subtle horizontal wire */}
          <div className="absolute inset-x-0 h-[2px] bg-slate-800" />
          <div
            className="absolute left-0 h-[2px] bg-gradient-to-r from-amber-700/60 to-amber-400"
            style={{ width: `${percentage}%` }}
          />

          {/* Golden Discrete Tick Pips */}
          <div className="absolute inset-x-0 flex justify-between pointer-events-none px-1">
            {Array.from({ length: ticks }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-slate-700 -translate-y-[2px]"
              />
            ))}
          </div>

          {/* Native Slider input for drag & accessibility */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
          />

          {/* Floating Gold Ring Indicator (Matching reference image) */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 flex items-center justify-center transition-all duration-75 z-10"
            style={{ left: `${percentage}%` }}
          >
            {/* Outer golden halo ring */}
            <div className="h-5 w-5 rounded-full border-2 border-amber-300/90 bg-[#0B0F17]/90 shadow-[0_0_12px_rgba(251,191,36,0.6)] flex items-center justify-center">
              {/* Inner concentric pip */}
              <div className="h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
            </div>
          </div>
        </div>

        {/* Right Ornamental Bracket Arrow */}
        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase ${label}`}
          className="h-6 w-6 rounded-full border border-amber-500/40 bg-slate-900/80 text-amber-300 hover:border-amber-400 hover:bg-amber-950/40 hover:text-amber-100 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.15)]"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
