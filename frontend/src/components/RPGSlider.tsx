'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { medicalDictionary } from '../data/medicalDictionary';

interface RPGSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  ticks?: number; // number of visual tick notches
  normalMin?: number;
  normalMax?: number;
}

export const RPGSlider: React.FC<RPGSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  ticks = 7,
  normalMin,
  normalMax,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
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

  // Check if out of normal range
  const isAbnormal =
    (normalMin !== undefined && value < normalMin) ||
    (normalMax !== undefined && value > normalMax);

  return (
    <div className="group relative bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl p-3.5 transition-all duration-200">
      {/* Header: Label, Unit & Value, Info button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs uppercase tracking-wider font-semibold font-mono text-slate-300 group-hover:text-cyan-300 transition-colors">
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

              {/* Tooltip Card */}
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

        {/* Value Display Badge */}
        <div className="flex items-center gap-1.5 font-mono">
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
              isAbnormal
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/80 text-cyan-300 border border-cyan-500/20'
            }`}
          >
            {value} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
          </span>
        </div>
      </div>

      {/* RPG Slider Control Bar (Inspired by Hogwarts Legacy screenshot) */}
      <div className="flex items-center gap-2">
        {/* Decrement Chevron Button */}
        <button
          type="button"
          onClick={handleDecrement}
          className="w-6 h-6 rounded-full bg-slate-800/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all active:scale-90"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Track Area */}
        <div className="relative flex-1 py-3 flex items-center">
          {/* Subtle tick notches along the track */}
          <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-75"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Golden/Cyan Notch Marks */}
          <div className="absolute inset-x-0 flex justify-between pointer-events-none px-0.5">
            {Array.from({ length: ticks }).map((_, i) => (
              <span
                key={i}
                className="w-1 h-1.5 rounded-full bg-slate-600/80 -translate-y-0.5"
              />
            ))}
          </div>

          {/* HTML Range Input Overlay for Dragging */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
          />

          {/* Concentric Target Ring Thumb (Hogwarts Legacy style) */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 flex items-center justify-center transition-all duration-75 z-10"
            style={{ left: `${percentage}%` }}
          >
            {/* Outer concentric pulsing ring */}
            <div className="w-5 h-5 rounded-full border border-amber-400/80 bg-slate-950/80 shadow-[0_0_12px_rgba(251,191,36,0.5)] flex items-center justify-center">
              {/* Inner glowing eye/core */}
              <div className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
            </div>
          </div>
        </div>

        {/* Increment Chevron Button */}
        <button
          type="button"
          onClick={handleIncrement}
          className="w-6 h-6 rounded-full bg-slate-800/80 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all active:scale-90"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Min/Max subtext footer */}
      <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-slate-500">
        <span>{min}</span>
        {normalMin !== undefined && normalMax !== undefined && (
          <span className="text-slate-500">
            Ref: {normalMin}-{normalMax}
          </span>
        )}
        <span>{max}</span>
      </div>
    </div>
  );
};
