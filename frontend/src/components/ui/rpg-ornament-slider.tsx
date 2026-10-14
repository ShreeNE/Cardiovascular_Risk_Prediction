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
      {/* Heading matching cardiovascular styling */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-serif tracking-widest text-xs uppercase text-[#F1F5FA] font-semibold">
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
                    <span className="text-[#A3B5C9]">Normal Range:</span>
                    <span className="text-[#83DDF3]">{termInfo.normalRange}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-xs font-mono font-medium text-[#FF334F]">
          {value} {unit}
        </span>
      </div>

      {/* Clinical Slider: (<) ---o--- (>) */}
      <div className="flex items-center gap-3">
        {/* Left Ornamental Bracket Arrow */}
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Decrease ${label}`}
          className="btn-corvita-stepper !h-6 !w-6 !rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Minimal Horizontal Line Track with Pips and Crimson Ring */}
        <div className="relative flex-1 py-3 flex items-center">
          {/* Subtle horizontal wire */}
          <div className="absolute inset-x-0 h-[2px] bg-[rgba(174,198,225,0.18)]" />
          <div
            className="absolute left-0 h-[2px] bg-gradient-to-r from-[#FF334F]/40 to-[#FF334F]"
            style={{ width: `${percentage}%` }}
          />

          {/* Discrete Tick Pips */}
          <div className="absolute inset-x-0 flex justify-between pointer-events-none px-1">
            {Array.from({ length: ticks }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[rgba(174,198,225,0.25)] -translate-y-[2px]"
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

          {/* Floating Crimson Ring Indicator */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 flex items-center justify-center transition-all duration-75 z-10"
            style={{ left: `${percentage}%` }}
          >
            {/* Outer halo ring */}
            <div className="h-5 w-5 rounded-full border-2 border-[#FF334F] bg-[#04070D] shadow-[0_0_14px_rgba(255,51,79,0.7)] flex items-center justify-center">
              {/* Inner concentric pip */}
              <div className="h-1.5 w-1.5 rounded-full bg-[#F1F5FA] shadow-[0_0_6px_rgba(255,51,79,0.9)]" />
            </div>
          </div>
        </div>

        {/* Right Ornamental Bracket Arrow */}
        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase ${label}`}
          className="btn-corvita-stepper !h-6 !w-6 !rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
