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
        <span className="text-[#8FA1B5] font-mono">{label}</span>
        <span style={{ color }} className="font-bold font-mono">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#050B14] border border-[#1C2A38] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function riskColor(r: number) {
  if (r >= 70) return '#F04452';
  if (r >= 50) return '#f59e0b';
  return '#22c55e';
}

function riskLabel(r: number) {
  if (r >= 70) return 'Severe';
  if (r >= 50) return 'Moderate';
  return 'Low';
}

const CATEGORY_STYLES: Record<string, string> = {
  'Low Risk': 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
  'Moderate Risk': 'text-amber-400 border-amber-500/50 bg-amber-950/40',
  'High Risk': 'text-rose-400 border-rose-500/50 bg-rose-950/50',
  'Critical CAD': 'text-[#F04452] border-[#F04452] bg-[#42121A] shadow-[0_0_15px_rgba(240,68,82,0.4)]',
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
    <div className="glass-panel-premium w-full h-full flex flex-col rounded-2xl overflow-hidden select-none">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-[rgba(174,198,225,0.18)] bg-[#080E18]/80 backdrop-blur-xl">
        <p className="font-mono tracking-widest text-[10px] uppercase text-[#FF334F] font-bold mb-2">
          Diagnostic Synthesis Report
        </p>

        {/* Overall score */}
        <div className="flex items-center gap-4">
          <div className={`shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ${catStyle}`}>
            <span className="text-3xl font-bold font-mono leading-none">
              {prediction.overallRiskScore}
            </span>
            <span className="text-[10px] font-mono opacity-70">%</span>
          </div>
          <div>
            <div className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border mb-1.5 ${catStyle}`}>
              {prediction.riskCategory}
            </div>
            <p className="text-[#F1F5FA] text-xs font-sans">
              CAD Probability: <span className="font-mono font-bold text-[#FF334F]">{(prediction.cadProbability * 100).toFixed(1)}%</span>
            </p>
            <p className="text-[#A3B5C9] text-[11px] font-sans mt-0.5">
              Vessels at risk: {prediction.predictedVessels}/3 · Dx: {prediction.cathDiagnosis}
            </p>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-[#4A1425]/50 scrollbar-track-transparent">

        {/* Vessel stenosis bars */}
        <div className="space-y-3">
          <h3 className="font-serif tracking-widest text-xs uppercase text-[#F1F5FA] font-bold">
            Coronary Stenosis Risk
          </h3>
          <div className="glass-card rounded-xl p-3.5 space-y-3">
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
            <h3 className="font-serif tracking-widest text-xs uppercase text-[#F1F5FA] font-bold">
              Key Risk Factors
            </h3>
            <div className="space-y-1.5">
              {prediction.keyRiskFactors.slice(0, 5).map((f, i) => {
                const dot =
                  f.severity === 'critical' ? '#FF334F'
                  : f.severity === 'high' ? '#f97316'
                  : f.severity === 'moderate' ? '#eab308'
                  : '#22c55e';
                return (
                  <div key={i} className="flex items-start gap-2.5 glass-card rounded-xl p-2.5">
                    <span
                      className="shrink-0 mt-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: dot }}
                    />
                    <div>
                      <p className="text-[#F1F5FA] text-[11px] font-semibold">{f.name}
                        <span className="text-[#A3B5C9] font-normal ml-1">· {f.value}</span>
                      </p>
                      <p className="text-[#A3B5C9] text-[10px] mt-0.5">{f.impact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hemodynamics */}
        <div className="glass-card rounded-xl p-3.5">
          <h3 className="font-mono tracking-widest text-[10px] uppercase text-[#A3B5C9] mb-2 font-bold">
            Patient Vitals Summary
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div><span className="text-[#A3B5C9]">Pulse:</span> <span className="text-[#F1F5FA] font-bold">{patient.pr} bpm</span></div>
            <div><span className="text-[#A3B5C9]">EF (TTE):</span> <span className="text-[#F1F5FA] font-bold">{patient.efTte}%</span></div>
            <div><span className="text-[#A3B5C9]">BP:</span> <span className="text-[#F1F5FA] font-bold">{patient.bp} mmHg</span></div>
            <div><span className="text-[#A3B5C9]">LDL:</span> <span className="text-[#F1F5FA] font-bold">{patient.ldl} mg/dL</span></div>
          </div>
        </div>

        <p className="text-[10px] text-[#A3B5C9]/60 font-mono text-center">
          Simulated: {new Date(prediction.simulationTimestamp).toLocaleTimeString()}
        </p>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-[rgba(174,198,225,0.18)] bg-[#080E18]/80 backdrop-blur-xl flex gap-2.5 shrink-0">
        <button
          onClick={onReset}
          className="btn-corvita-ghost flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-serif tracking-wider uppercase cursor-pointer transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#FF536B]" />
          Reset
        </button>
        <button
          onClick={onRunAgain}
          disabled={isSimulating}
          className="btn-corvita btn-md flex-1 flex items-center justify-center gap-2 text-white text-xs font-serif tracking-wider uppercase cursor-pointer disabled:opacity-50 font-bold"
        >
          {isSimulating ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          Run Again
        </button>
      </div>
    </div>
  );
};
