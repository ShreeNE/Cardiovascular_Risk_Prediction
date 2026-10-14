'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { PredictionResult } from '../types/medical';
import { Button } from './ui/button';

interface PredictionResultsHUDProps {
  prediction: PredictionResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PredictionResultsHUD: React.FC<PredictionResultsHUDProps> = ({
  prediction,
  isOpen,
  onClose,
}) => {
  if (!prediction) return null;

  const isHighRisk = prediction.overallRiskScore >= 50;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-[#080B10]/85 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            className="relative w-full max-w-2xl bg-[#0B0F17] border border-amber-500/30 rounded-xl p-6 sm:p-7 shadow-2xl text-slate-100 max-h-[88vh] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500/20"
          >
            {/* Top gold accent rule */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-7 w-7 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center border font-mono font-bold text-lg ${
                  isHighRisk
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                    : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                }`}
              >
                {prediction.overallRiskScore}%
              </div>
              <div>
                <span className="font-serif tracking-widest text-[10px] uppercase text-amber-200/70 block">
                  Simulation Output
                </span>
                <h2 className="text-lg font-serif font-semibold text-white">
                  CAD Risk Category: {prediction.riskCategory}
                </h2>
                <p className="text-[11px] text-slate-400 font-sans">
                  Cath Outcome Probability: {prediction.cathDiagnosis} ({prediction.predictedVessels} vessels involved)
                </p>
              </div>
            </div>

            {/* Vessel Perfusion Summary */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-serif uppercase tracking-wider text-slate-400 block mb-0.5">
                  LAD Territory
                </span>
                <div className="text-sm font-semibold font-mono text-amber-300">
                  {prediction.ladStenosisRisk.toFixed(2)}% Risk
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-serif uppercase tracking-wider text-slate-400 block mb-0.5">
                  LCX Territory
                </span>
                <div className="text-sm font-semibold font-mono text-amber-300">
                  {prediction.lcxStenosisRisk.toFixed(2)}% Risk
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-serif uppercase tracking-wider text-slate-400 block mb-0.5">
                  RCA Territory
                </span>
                <div className="text-sm font-semibold font-mono text-amber-300">
                  {prediction.rcaStenosisRisk.toFixed(2)}% Risk
                </div>
              </div>
            </div>

            {/* Key Clinical Risk Contributors */}
            <div className="mb-5 space-y-2">
              <div className="space-y-1">
                <h3 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                  Primary Clinical Risk Drivers
                </h3>
                <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
              </div>

              <div className="space-y-1.5 pt-1">
                {prediction.keyRiskFactors.length > 0 ? (
                  prediction.keyRiskFactors.map((rf, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md bg-slate-900/30 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-slate-200">{rf.name}:</span>{' '}
                        <span className="text-amber-200 font-mono">{rf.value}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{rf.impact}</p>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-medium ${
                          rf.severity === 'critical'
                            ? 'text-rose-300 bg-rose-950/40 border border-rose-500/40'
                            : rf.severity === 'high'
                            ? 'text-amber-300 bg-amber-950/40 border border-amber-500/40'
                            : 'text-slate-400 bg-slate-800'
                        }`}
                      >
                        {rf.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-1">No significant pathological risk markers detected.</p>
                )}
              </div>
            </div>

            {/* Protective Factors */}
            {prediction.protectiveFactors.length > 0 && (
              <div className="mb-5 space-y-2">
                <div className="space-y-1">
                  <h3 className="font-serif tracking-widest text-xs uppercase text-amber-100/70">
                    Favorable Parameters
                  </h3>
                  <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {prediction.protectiveFactors.map((pf, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      {pf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Close button */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
                Close Report
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
