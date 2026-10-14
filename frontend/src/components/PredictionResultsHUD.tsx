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
            className="fixed inset-0 bg-[#04070D]/80 backdrop-blur-xl cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            className="relative w-full max-w-2xl bg-[rgba(15,27,42,0.88)] border border-[rgba(174,198,225,0.22)] rounded-2xl p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl text-[#F1F5FA] max-h-[88vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#4A1425]/50"
          >
            {/* Top crimson accent rule */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF334F]/90 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 btn-corvita btn-icon !h-8 !w-8 flex items-center justify-center text-white cursor-pointer"
              title="Close Report"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center border font-mono font-bold text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ${
                  isHighRisk
                    ? 'glass-crimson-selected text-[#FF334F]'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                }`}
              >
                {prediction.overallRiskScore}%
              </div>
              <div>
                <span className="font-mono tracking-widest text-[10px] uppercase text-[#FF334F] font-bold block">
                  Simulation Output
                </span>
                <h2 className="text-lg font-serif font-bold text-white">
                  CAD Risk Category: {prediction.riskCategory}
                </h2>
                <p className="text-[11px] text-[#A3B5C9] font-sans">
                  Cath Outcome Probability: {prediction.cathDiagnosis} ({prediction.predictedVessels} vessels involved)
                </p>
              </div>
            </div>

            {/* Vessel Perfusion Summary */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 rounded-xl glass-card">
                <span className="text-[10px] font-serif uppercase tracking-wider text-[#A3B5C9] block mb-0.5">
                  LAD Territory
                </span>
                <div className="text-sm font-semibold font-mono text-[#FF334F]">
                  {prediction.ladStenosisRisk.toFixed(2)}% Risk
                </div>
              </div>

              <div className="p-3 rounded-xl glass-card">
                <span className="text-[10px] font-serif uppercase tracking-wider text-[#A3B5C9] block mb-0.5">
                  LCX Territory
                </span>
                <div className="text-sm font-semibold font-mono text-[#FF334F]">
                  {prediction.lcxStenosisRisk.toFixed(2)}% Risk
                </div>
              </div>

              <div className="p-3 rounded-xl glass-card">
                <span className="text-[10px] font-serif uppercase tracking-wider text-[#A3B5C9] block mb-0.5">
                  RCA Territory
                </span>
                <div className="text-sm font-semibold font-mono text-[#FF334F]">
                  {prediction.rcaStenosisRisk.toFixed(2)}% Risk
                </div>
              </div>
            </div>

            {/* Key Clinical Risk Contributors */}
            <div className="mb-5 space-y-2">
              <div className="space-y-1">
                <h3 className="font-serif tracking-widest text-xs uppercase text-[#F1F5FA] font-bold">
                  Primary Clinical Risk Drivers
                </h3>
                <div className="h-[1px] w-full bg-gradient-to-r from-[#FF334F]/40 via-[#4A1425]/30 to-transparent" />
              </div>

              <div className="space-y-1.5 pt-1">
                {prediction.keyRiskFactors.length > 0 ? (
                  prediction.keyRiskFactors.map((rf, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl glass-card flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#F1F5FA]">{rf.name}:</span>{' '}
                        <span className="text-[#FF334F] font-mono">{rf.value}</span>
                        <p className="text-[10px] text-[#A3B5C9] mt-0.5">{rf.impact}</p>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-medium ${
                          rf.severity === 'critical'
                            ? 'text-[#FF334F] glass-crimson-selected'
                            : rf.severity === 'high'
                            ? 'text-orange-300 bg-orange-950/40 border border-orange-500/40'
                            : 'text-[#A3B5C9] bg-[rgba(4,8,15,0.7)]'
                        }`}
                      >
                        {rf.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#A3B5C9] py-1">No significant pathological risk markers detected.</p>
                )}
              </div>
            </div>

            {/* Protective Factors */}
            {prediction.protectiveFactors.length > 0 && (
              <div className="mb-5 space-y-2">
                <div className="space-y-1">
                  <h3 className="font-serif tracking-widest text-xs uppercase text-[#F1F5FA] font-bold">
                    Favorable Parameters
                  </h3>
                  <div className="h-[1px] w-full bg-gradient-to-r from-[#FF334F]/40 via-[#4A1425]/30 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {prediction.protectiveFactors.map((pf, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg glass-card text-[11px] text-[#F1F5FA] flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {pf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Close button */}
            <div className="pt-3 border-t border-[rgba(174,198,225,0.18)] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-corvita btn-sm px-5 py-2 text-xs font-serif tracking-wider uppercase font-semibold cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
