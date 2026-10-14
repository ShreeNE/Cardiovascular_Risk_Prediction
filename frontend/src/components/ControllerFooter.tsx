'use client';

import React from 'react';

interface ControllerFooterProps {
  onRunSimulation: () => void;
  onRandomize: () => void;
  onReset: () => void;
  onOpenDisclaimer: () => void;
}

export const ControllerFooter: React.FC<ControllerFooterProps> = ({
  onRunSimulation,
  onRandomize,
  onReset,
  onOpenDisclaimer,
}) => {
  return (
    <footer className="w-full border-t border-amber-500/10 bg-[#080B10]/95 px-6 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400 z-30 select-none">
      {/* Understated Medical Disclaimer link */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDisclaimer}
          className="text-[11px] text-[#A3B5C9] hover:text-[#FF536B] transition-colors underline-offset-4 hover:underline cursor-pointer font-sans"
        >
          Medical Disclaimer & Protocol Notice
        </button>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline font-sans">
          Educational Demonstration Only
        </span>
      </div>

      {/* Gamepad Prompts */}
      <div className="flex items-center gap-5">
        <button
          onClick={onRunSimulation}
          className="flex items-center gap-1.5 text-[#FF536B] hover:text-white transition-colors cursor-pointer"
        >
          <span className="w-4 h-4 rounded-full border border-[#FF536B]/80 bg-[#FF536B]/20 text-white flex items-center justify-center text-[9px] font-bold shadow-[0_0_8px_rgba(255,49,88,0.5)]">
            ✕
          </span>
          <span className="text-[11px] font-serif tracking-wider uppercase font-semibold">Run Simulation</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[#A3B5C9] hover:text-white transition-colors cursor-pointer"
        >
          <span className="w-4 h-4 rounded-full border border-[rgba(255,83,107,0.4)] bg-[rgba(255,83,107,0.15)] text-[#A3B5C9] flex items-center justify-center text-[9px] font-bold">
            ○
          </span>
          <span className="text-[11px] font-serif tracking-wider uppercase">Reset</span>
        </button>
      </div>
    </footer>
  );
};
