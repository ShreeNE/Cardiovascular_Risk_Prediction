'use client';

import * as React from 'react';
import { Minus, Plus, Info } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { medicalDictionary } from '@/data/medicalDictionary';

interface ClinicalStepperInputProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  normalMin?: number;
  normalMax?: number;
  className?: string;
}

export const ClinicalStepperInput: React.FC<ClinicalStepperInputProps> = ({
  id,
  label,
  value,
  min = 0,
  max = 999,
  step = 1,
  unit = '',
  onChange,
  normalMin,
  normalMax,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    } else if (e.target.value === '') {
      onChange(0);
    }
  };

  const isAbnormal =
    (normalMin !== undefined && value < normalMin) ||
    (normalMax !== undefined && value > normalMax);

  return (
    <div
      className={cn(
        'group relative glass-card-premium rounded-xl p-2.5 transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={id}
            className="param-label-clean font-sans"
          >
            {label}
          </label>
          {termInfo && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-[#A3B5C9]/60 hover:text-[#83DDF3] transition-colors cursor-pointer"
                title="Clinical Definition"
              >
                <Info className="w-3 h-3" />
              </button>

              {showTooltip && (
                <div className="absolute left-0 bottom-5 z-50 w-64 rounded-xl border border-white/15 bg-[rgba(8,14,24,0.96)] backdrop-blur-xl p-3 shadow-2xl text-[11px] text-[#F1F5FA] pointer-events-none font-sans">
                  <div className="font-semibold text-[#83DDF3] font-serif mb-0.5">{termInfo.name}</div>
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

        {normalMin !== undefined && normalMax !== undefined && (
          <span
            className={cn(
              'text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap',
              isAbnormal
                ? 'text-[#FF334F] bg-[#FF334F]/8 border border-[#FF334F]/20'
                : 'text-[#A3B5C9]/60'
            )}
          >
            Ref: {normalMin}–{normalMax} {unit}
          </span>
        )}
      </div>

      {/* Input row with inset glass steppers and unit */}
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Decrease ${label}`}
          className="btn-corvita-stepper"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1 h-8 bg-[rgba(4,8,15,0.82)] border border-[rgba(174,198,225,0.14)] rounded-lg flex items-center justify-center gap-1.5 px-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] focus-within:border-[rgba(255,51,79,0.5)] focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_0_10px_rgba(255,51,79,0.25)] transition-all">
          <input
            id={id}
            type="number"
            step={step}
            min={min}
            max={max}
            value={value || ''}
            onChange={handleInputChange}
            className="w-14 text-center text-xs font-mono font-bold bg-transparent border-none text-[#F1F5FA] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {unit && (
            <span className="text-[10px] font-mono text-[#A3B5C9] pointer-events-none select-none">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase ${label}`}
          className="btn-corvita-stepper"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
