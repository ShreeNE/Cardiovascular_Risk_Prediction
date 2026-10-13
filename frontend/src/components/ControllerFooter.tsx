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
          className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors underline-offset-4 hover:underline cursor-pointer font-sans"
        >
          Medical Disclaimer & Protocol Notice
        </button>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline font-sans">
          Educational Demonstration Only
        </span>
      </div>

      {/* Hogwarts Legacy style Gamepad Prompts */}
      <div className="flex items-center gap-5">
        <button
          onClick={onRunSimulation}
          className="flex items-center gap-1.5 text-amber-200 hover:text-white transition-colors cursor-pointer"
        >
          <span className="w-4 h-4 rounded-full border border-amber-400/80 bg-amber-400/20 text-amber-200 flex items-center justify-center text-[9px] font-bold">
            ✕
          </span>
          <span className="text-[11px] font-serif tracking-wider uppercase">Run Simulation</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span className="w-4 h-4 rounded-full border border-slate-700 bg-slate-900 text-slate-400 flex items-center justify-center text-[9px] font-bold">
            ○
          </span>
          <span className="text-[11px] font-serif tracking-wider uppercase">Reset</span>
        </button>
      </div>
    </footer>
  );
};
