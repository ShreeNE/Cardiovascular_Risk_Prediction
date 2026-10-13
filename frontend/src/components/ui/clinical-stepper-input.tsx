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
        'group relative rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 transition-colors hover:border-slate-700/90',
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={id}
            className="text-[11px] font-medium uppercase tracking-wider text-slate-300 font-sans"
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

        {normalMin !== undefined && normalMax !== undefined && (
          <span
            className={cn(
              'text-[10px] font-mono px-1.5 py-0.2 rounded',
              isAbnormal
                ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                : 'text-slate-500'
            )}
          >
            Ref: {normalMin}–{normalMax} {unit}
          </span>
        )}
      </div>

      {/* Input row with steppers and unit */}
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Decrease ${label}`}
          className="h-8 w-8 rounded border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1">
          <Input
            id={id}
            type="number"
            step={step}
            min={min}
            max={max}
            value={value || ''}
            onChange={handleInputChange}
            className="h-8 pr-12 text-center text-xs font-mono bg-slate-950/70 border-slate-800 text-slate-100 focus:border-amber-500/60 focus:ring-amber-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {unit && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 pointer-events-none select-none">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase ${label}`}
          className="h-8 w-8 rounded border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
