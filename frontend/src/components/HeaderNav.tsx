'use client';

import React from 'react';
import { ShieldAlert, HeartPulse, Sparkles, Terminal, Cpu } from 'lucide-react';

interface HeaderNavProps {
  onOpenDisclaimer: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onOpenDisclaimer }) => {
  return (
    <header className="w-full border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <HeartPulse className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold tracking-widest font-mono text-white flex items-center gap-2">
              <span className="text-cyan-400">CORVITA</span> // RISK CUSTOMIZER
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              v2.4 RPG-CAD
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
            Z-Alizadeh Sani Coronary Stenosis & Hemodynamic Synthesizer
          </p>
        </div>
      </div>

      {/* Center Status Banner (Sci-Fi HUD) */}
      <div className="hidden lg:flex items-center gap-6 font-mono text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>NEURAL ENGINE:</span>
          <span className="text-emerald-400 font-bold">CALIBRATED</span>
        </div>
        <div className="w-px h-4 bg-slate-800" />
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span>DATASET:</span>
          <span className="text-slate-200">Z-ALIZADEH SANI (303 COHORT)</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenDisclaimer}
          className="btn-corvita btn-sm flex items-center gap-2 cursor-pointer group"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Medical Disclaimer</span>
          <span className="sm:hidden">Notice</span>
        </button>
      </div>
    </header>
  );
};
