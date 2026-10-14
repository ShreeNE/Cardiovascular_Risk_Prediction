'use client';

import React from 'react';
import { PredictionResult, PatientClinicalData } from '../types/medical';
import { RotateCcw, Play } from 'lucide-react';

interface PredictionInlinePanelProps {
  prediction: PredictionResult;
  patient: PatientClinicalData;
  onReset: () => void;
  onRunAgain: () => void;
  isSimulating: boolean;
}

function RiskBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400 font-mono">{label}</span>
        <span style={{ color }} className="font-bold font-mono">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function riskColor(r: number) {
  if (r >= 70) return '#ef4444';
  if (r >= 50) return '#eab308';
  return '#22c55e';
}

function riskLabel(r: number) {
  if (r >= 70) return 'Severe';
  if (r >= 50) return 'Moderate';
  return 'Low';
}

const CATEGORY_STYLES: Record<string, string> = {
  'Low Risk': 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40',
  'Moderate Risk': 'text-yellow-300 border-yellow-500/40 bg-yellow-950/40',
  'High Risk': 'text-orange-300 border-orange-500/40 bg-orange-950/40',
  'Critical CAD': 'text-rose-300 border-rose-500/40 bg-rose-950/60',
};

export const PredictionInlinePanel: React.FC<PredictionInlinePanelProps> = ({
  prediction,
  patient,
  onReset,
  onRunAgain,
  isSimulating,
}) => {
  const catStyle = CATEGORY_STYLES[prediction.riskCategory] ?? CATEGORY_STYLES['Low Risk'];

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0F17]/85 rounded-xl border border-slate-800/80 shadow-2xl backdrop-blur-md overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800/80">
        <p className="font-serif tracking-widest text-[10px] uppercase text-amber-200/60 mb-2">
          Diagnostic Synthesis Report
        </p>

        {/* Overall score */}
        <div className="flex items-center gap-4">
          <div className={`shrink-0 w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 ${catStyle}`}>
            <span className="text-3xl font-bold font-mono leading-none">
              {prediction.overallRiskScore}
            </span>
            <span className="text-[10px] font-mono opacity-70">%</span>
          </div>
          <div>
            <div className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border mb-1 ${catStyle}`}>
              {prediction.riskCategory}
            </div>
            <p className="text-slate-300 text-xs font-sans">
              CAD Probability: <span className="font-mono font-bold text-amber-200">{(prediction.cadProbability * 100).toFixed(1)}%</span>
            </p>
            <p className="text-slate-400 text-[11px] font-sans mt-0.5">
              Vessels at risk: {prediction.predictedVessels}/3 · Dx: {prediction.cathDiagnosis}
            </p>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">

        {/* Vessel stenosis bars */}
        <div className="space-y-3">
          <h3 className="font-serif tracking-widest text-[10px] uppercase text-amber-100/70">
            Coronary Stenosis Risk
          </h3>
          <div className="bg-slate-900/60 rounded-lg p-3 space-y-3">
            {[
              { label: 'LAD — Left Anterior Descending', value: prediction.ladStenosisRisk },
              { label: 'LCX — Left Circumflex', value: prediction.lcxStenosisRisk },
              { label: 'RCA — Right Coronary', value: prediction.rcaStenosisRisk },
            ].map(({ label, value }) => (
              <div key={label}>
                <RiskBar value={value} label={label} color={riskColor(value)} />
                <p className="text-[10px] font-mono mt-0.5" style={{ color: riskColor(value) }}>
                  {riskLabel(value)} stenosis risk
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key risk factors */}
        {prediction.keyRiskFactors.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-serif tracking-widest text-[10px] uppercase text-amber-100/70">
              Key Risk Factors
            </h3>
            <div className="space-y-1.5">
              {prediction.keyRiskFactors.slice(0, 5).map((f, i) => {
                const dot =
                  f.severity === 'critical' ? '#ef4444'
                  : f.severity === 'high' ? '#f97316'
                  : f.severity === 'moderate' ? '#eab308'
                  : '#22c55e';
                return (
                  <div key={i} className="flex items-start gap-2 bg-slate-900/50 rounded p-2">
                    <span
                      className="shrink-0 mt-0.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: dot }}
                    />
                    <div>
                      <p className="text-slate-200 text-[11px] font-medium">{f.name}
                        <span className="text-slate-500 font-normal ml-1">· {f.value}</span>
                      </p>
                      <p className="text-slate-500 text-[10px]">{f.impact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Protective factors */}
        {prediction.protectiveFactors.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-serif tracking-widest text-[10px] uppercase text-emerald-400/70">
              Protective Factors
            </h3>
            <div className="space-y-1">
              {prediction.protectiveFactors.map((f, i) => (
                <p key={i} className="text-[11px] text-emerald-300/80 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  {f}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Clinical observations */}
        {prediction.clinicalObservations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-serif tracking-widest text-[10px] uppercase text-slate-400/70">
              Clinical Notes
            </h3>
            <div className="space-y-1.5">
              {prediction.clinicalObservations.slice(0, 3).map((obs, i) => (
                <p key={i} className="text-[11px] text-slate-400 leading-relaxed">
                  {obs}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Hemodynamics */}
        <div className="bg-slate-900/40 rounded-lg p-3">
          <h3 className="font-serif tracking-widest text-[10px] uppercase text-slate-500 mb-2">
            Patient Vitals Summary
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div><span className="text-slate-500">Pulse:</span> <span className="text-slate-200">{patient.pr} bpm</span></div>
            <div><span className="text-slate-500">EF (TTE):</span> <span className="text-slate-200">{patient.efTte}%</span></div>
            <div><span className="text-slate-500">BP:</span> <span className="text-slate-200">{patient.bp} mmHg</span></div>
            <div><span className="text-slate-500">LDL:</span> <span className="text-slate-200">{patient.ldl} mg/dL</span></div>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 font-mono text-center">
          Simulated: {new Date(prediction.simulationTimestamp).toLocaleTimeString()}
        </p>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#080B10]/95 flex gap-2">
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs font-serif tracking-wider uppercase cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          onClick={onRunAgain}
          disabled={isSimulating}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors text-xs font-serif tracking-wider uppercase cursor-pointer disabled:opacity-50"
        >
          {isSimulating ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          Run Again
        </button>
      </div>
    </div>
  );
};
