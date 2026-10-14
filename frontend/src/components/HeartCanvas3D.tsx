'use client';

import React, { useEffect, useRef, useState, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  useProgress,
} from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import gsap from 'gsap';
import { PatientClinicalData, PredictionResult } from '../types/medical';

// ─── Pre-load both assets so they are cached immediately ─────────────────────
useGLTF.preload('/assets/torso.glb');
useGLTF.preload('/assets/heart.glb');

// ─── Types ────────────────────────────────────────────────────────────────────
interface HeartCanvas3DProps {
  patient: PatientClinicalData;
  prediction: PredictionResult | null;
  isSimulating: boolean;
}

export type VesselKey = 'Vessel_LAD' | 'Vessel_LCX' | 'Vessel_RCA';
export type VesselCode = 'LAD' | 'LCX' | 'RCA';

export interface VesselData {
  key: VesselKey;
  code: VesselCode;
  name: string;
  subname: string;
  territory: string;
  clinicalNote: string;
  risk: number;
  status: string;
  color: string;
  emissive: string;
  fallbackStatus?: string;
}

// ─── Exact Centering & Scaling Offsets (Derived from raw GLB bounding boxes) ──
// Torso raw bounding box: size (0.702, 0.890, 0.538), center (-0.0179, 0.1981, -0.0517)
const TORSO_SCALE = 2.45;
const TORSO_OFFSET: [number, number, number] = [
  0.01787 * TORSO_SCALE,
  -0.19808 * TORSO_SCALE,
  0.05174 * TORSO_SCALE,
];

// Heart raw bounding box: size (0.1193, 0.1088, 0.1131), center (0.0227, 1.2911, 0.0247)
const HEART_SCALE = 14.5;
const HEART_OFFSET: [number, number, number] = [
  -0.02275 * HEART_SCALE,
  -1.29106 * HEART_SCALE,
  -0.02474 * HEART_SCALE,
];

// ─── Diagnostic Color Mapper ──────────────────────────────────────────────────
function getVesselColorConfig(risk: number) {
  if (risk >= 70) {
    return {
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 2.2,
      status: 'Severe Stenosis (High Risk)',
      badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    };
  }
  if (risk >= 50) {
    return {
      color: '#f59e0b',
      emissive: '#f59e0b',
      emissiveIntensity: 1.6,
      status: 'Moderate Stenosis (Elevated)',
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    };
  }
  return {
    color: '#10b981',
    emissive: '#10b981',
    emissiveIntensity: 1.2,
    status: 'Patent / Healthy Perfusion',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };
}

// ─── Build Vessel Info ────────────────────────────────────────────────────────
function buildVesselData(
  code: VesselCode,
  prediction: PredictionResult | null,
  patient: PatientClinicalData
): VesselData {
  const configs: Record<
    VesselCode,
    {
      key: VesselKey;
      name: string;
      subname: string;
      territory: string;
      clinicalNote: string;
      riskVal: number | undefined;
      fallback: string;
    }
  > = {
    LAD: {
      key: 'Vessel_LAD',
      name: 'Left Anterior Descending',
      subname: 'Anterior Interventricular Branch',
      territory: 'Anterolateral LV wall, cardiac apex, anterior 2/3 of interventricular septum.',
      clinicalNote:
        'Primary coronary conduit ("widow-maker"). Severe occlusion creates acute anterior wall STEMI with high risk of cardiogenic shock.',
      riskVal: prediction?.ladStenosisRisk,
      fallback: patient.ladProximal,
    },
    LCX: {
      key: 'Vessel_LCX',
      name: 'Left Circumflex',
      subname: 'Left Circumflex Branch',
      territory: 'Posterolateral left ventricle, lateral free wall, and left atrium.',
      clinicalNote:
        'Occlusion causes lateral MI, often presenting with subtle or non-diagnostic ECG changes requiring heightened clinical suspicion.',
      riskVal: prediction?.lcxStenosisRisk,
      fallback: patient.lcxProximal,
    },
    RCA: {
      key: 'Vessel_RCA',
      name: 'Right Coronary Artery',
      subname: 'Main RCA & Posterior Descending (PDA)',
      territory: 'Right ventricle, inferior LV wall, posterior 1/3 of septum, SA node (60%) and AV node (90%).',
      clinicalNote:
        'Inferior STEMI frequently accompanies RV infarction, severe bradyarrhythmias, and high-degree AV conduction blocks.',
      riskVal: prediction?.rcaStenosisRisk,
      fallback: patient.rcaProximal,
    },
  };

  const c = configs[code];
  const risk = c.riskVal ?? (c.fallback === 'Stenotic' ? 75 : 12);
  const colorCfg = getVesselColorConfig(risk);

  return {
    key: c.key,
    code,
    name: c.name,
    subname: c.subname,
    territory: c.territory,
    clinicalNote: c.clinicalNote,
    risk,
    status: colorCfg.status,
    color: colorCfg.color,
    emissive: colorCfg.emissive,
    fallbackStatus: c.fallback,
  };
}

// ─── DOM Loader Overlay (Avoids Html unmount race condition) ─────────────────
function DOMLoader() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#080B10]/85 pointer-events-none backdrop-blur-xs">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
      <span className="text-cyan-300 font-mono text-xs tracking-widest uppercase">
        Loading 3D Anatomy {progress.toFixed(0)}%
      </span>
    </div>
  );
}

function CanvasLoaderBridge({ onLoading }: { onLoading: (v: boolean) => void }) {
  const { active } = useProgress();
  useEffect(() => {
    onLoading(active);
  }, [active, onLoading]);
  return null;
}

// ─── Torso Model (Holographic Frosted Glass) ──────────────────────────────────
function TorsoModel() {
  const { scene } = useGLTF('/assets/torso.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const matName = (mesh.material as THREE.Material)?.name || '';

      if (matName.includes('Artery')) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ef4444'),
          transparent: true,
          opacity: 0.45,
          roughness: 0.3,
          metalness: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      } else if (matName.includes('Vein')) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#0284c7'),
          transparent: true,
          opacity: 0.45,
          roughness: 0.3,
          metalness: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#38bdf8'),
          transparent: true,
          opacity: 0.18,
          roughness: 0.2,
          metalness: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      }
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });
  }, [scene]);

  return (
    <group position={TORSO_OFFSET} scale={TORSO_SCALE}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Heart Model with dynamic vessel color-coding + click interaction ─────────
interface HeartModelProps {
  prediction: PredictionResult | null;
  patient: PatientClinicalData;
  selectedVessel: VesselData | null;
  onSelectVessel: (v: VesselData | null) => void;
}

function HeartModel({
  prediction,
  patient,
  selectedVessel,
  onSelectVessel,
}: HeartModelProps) {
  const { scene } = useGLTF('/assets/heart.glb');
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);

  // Apply anatomical materials + dynamic vessel colors
  useEffect(() => {
    const ladCfg = getVesselColorConfig(
      prediction?.ladStenosisRisk ?? (patient.ladProximal === 'Stenotic' ? 75 : 12)
    );
    const lcxCfg = getVesselColorConfig(
      prediction?.lcxStenosisRisk ?? (patient.lcxProximal === 'Stenotic' ? 75 : 12)
    );
    const rcaCfg = getVesselColorConfig(
      prediction?.rcaStenosisRisk ?? (patient.rcaProximal === 'Stenotic' ? 75 : 12)
    );

    const vesselColorMap: Record<string, typeof ladCfg> = {
      Vessel_LAD: ladCfg,
      Vessel_LCX: lcxCfg,
      Vessel_RCA: rcaCfg,
    };

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const meshName = mesh.name;

      if (vesselColorMap[meshName]) {
        const cfg = vesselColorMap[meshName];
        const isSelected = selectedVessel?.key === meshName;
        const isHovered = hoveredVessel === meshName;

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(cfg.color),
          emissive: new THREE.Color(cfg.emissive),
          emissiveIntensity: isSelected
            ? cfg.emissiveIntensity + 1.2
            : isHovered
            ? cfg.emissiveIntensity + 0.6
            : cfg.emissiveIntensity,
          roughness: 0.18,
          metalness: 0.25,
        });
        mesh.material = mat;
      } else if (meshName === 'Object_151' || meshName === 'Object_152') {
        // Deep anatomical cardiac muscle (replaces muddy metallic brown)
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#7f1d1d'),
          roughness: 0.65,
          metalness: 0.05,
        });
      } else if (meshName === 'Object_123' || meshName === 'Object_148') {
        // Aorta and pulmonary trunk
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#991b1b'),
          roughness: 0.35,
          metalness: 0.1,
        });
      } else if (
        meshName === 'Object_174' ||
        meshName === 'Object_177' ||
        meshName === 'Object_179' ||
        meshName === 'Object_198'
      ) {
        // Vena Cava / pulmonary veins
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#1d4ed8'),
          roughness: 0.4,
          metalness: 0.1,
        });
      } else {
        // Cartilage / connective tissue
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#f1f5f9'),
          roughness: 0.5,
          metalness: 0.05,
        });
      }
    });
  }, [scene, prediction, patient, selectedVessel, hoveredVessel]);

  // Click handler
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const meshName = e.object.name;

      if (meshName === 'Vessel_LAD') {
        onSelectVessel(buildVesselData('LAD', prediction, patient));
      } else if (meshName === 'Vessel_LCX') {
        onSelectVessel(buildVesselData('LCX', prediction, patient));
      } else if (meshName === 'Vessel_RCA') {
        onSelectVessel(buildVesselData('RCA', prediction, patient));
      } else {
        // Clicking cardiac muscle or background deselects
        onSelectVessel(null);
      }
    },
    [prediction, patient, onSelectVessel]
  );

  // Hover handlers for pointer feedback
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const meshName = e.object.name;
    if (
      meshName === 'Vessel_LAD' ||
      meshName === 'Vessel_LCX' ||
      meshName === 'Vessel_RCA'
    ) {
      document.body.style.cursor = 'pointer';
      setHoveredVessel(meshName);
    }
  }, []);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
    setHoveredVessel(null);
  }, []);

  return (
    <group position={HEART_OFFSET} scale={HEART_SCALE}>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    </group>
  );
}

// ─── Camera Transition Controller ─────────────────────────────────────────────
type ViewAngle = 'anterior' | 'lateral' | 'inferior';

interface CameraAnimatorProps {
  isPredicted: boolean;
  viewAngle: ViewAngle;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

function CameraAnimator({
  isPredicted,
  viewAngle,
  controlsRef,
}: CameraAnimatorProps) {
  const { camera } = useThree();
  const prevPredicted = useRef(isPredicted);
  const prevViewAngle = useRef(viewAngle);

  useEffect(() => {
    let target = { x: 0, y: 0, z: 4.2 };

    if (isPredicted) {
      if (viewAngle === 'anterior') {
        target = { x: 0.5, y: 0.15, z: 4.2 };
      } else if (viewAngle === 'lateral') {
        target = { x: 3.8, y: 0.4, z: 1.6 };
      } else if (viewAngle === 'inferior') {
        target = { x: -2.8, y: -1.4, z: 2.8 };
      }
    } else {
      target = { x: 0, y: 0, z: 4.2 };
    }

    const isInitial =
      prevPredicted.current !== isPredicted ||
      prevViewAngle.current !== viewAngle;

    if (isInitial) {
      prevPredicted.current = isPredicted;
      prevViewAngle.current = viewAngle;

      gsap.to(camera.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        },
      });
    }
  }, [isPredicted, viewAngle, camera, controlsRef]);

  return null;
}

// ─── Top-Right Coronary Perfusion Summary Badge (Default) ──────────────────────
interface SummaryBadgeProps {
  prediction: PredictionResult | null;
  patient: PatientClinicalData;
  onSelectCode: (code: VesselCode) => void;
}

function CoronarySummaryBadge({
  prediction,
  patient,
  onSelectCode,
}: SummaryBadgeProps) {
  const vessels: Array<{ code: VesselCode; data: VesselData }> = [
    { code: 'LAD', data: buildVesselData('LAD', prediction, patient) },
    { code: 'LCX', data: buildVesselData('LCX', prediction, patient) },
    { code: 'RCA', data: buildVesselData('RCA', prediction, patient) },
  ];

  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-auto">
      <div className="bg-[#0B0F17]/90 border border-slate-800/90 rounded-xl p-3 backdrop-blur-md shadow-2xl font-sans w-56 transition-all hover:border-amber-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="font-serif tracking-widest text-[10px] uppercase text-amber-200/90 font-medium">
            Coronary Perfusion
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="space-y-1.5">
          {vessels.map(({ code, data }) => (
            <button
              key={code}
              type="button"
              onClick={() => onSelectCode(code)}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md bg-slate-900/50 hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                  style={{ backgroundColor: data.color }}
                />
                <span className="text-slate-300 font-mono text-[11px] font-semibold">
                  {code}
                </span>
              </div>
              <span
                className="font-mono text-[11px] font-medium"
                style={{ color: data.color }}
              >
                {data.risk}% Risk
              </span>
            </button>
          ))}
        </div>

        <p className="text-[9px] font-mono text-slate-500 text-center mt-2 pt-1.5 border-t border-slate-800/60">
          Click any vessel to inspect details
        </p>
      </div>
    </div>
  );
}

// ─── Top-Right Vessel Detail Popup (When a vessel is clicked) ──────────────────
interface DetailPopupProps {
  vessel: VesselData;
  onClose: () => void;
  onSelectCode: (code: VesselCode) => void;
}

function VesselDetailPopup({
  vessel,
  onClose,
  onSelectCode,
}: DetailPopupProps) {
  return (
    <div className="absolute top-4 right-4 z-30 pointer-events-auto">
      <div
        className="w-80 rounded-xl border backdrop-blur-xl shadow-2xl p-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-200"
        style={{
          borderColor: vessel.color + '70',
          backgroundColor: '#0B0F17F5',
          boxShadow: `0 10px 30px -5px ${vessel.color}25, 0 0 15px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 animate-ping"
                style={{ backgroundColor: vessel.color }}
              />
              <span className="font-serif tracking-wider text-[10px] uppercase text-amber-200/90 font-medium">
                Coronary Analysis
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-100 tracking-tight mt-0.5">
              {vessel.name}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              ({vessel.code}) · {vessel.subname}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Risk Metrics */}
        <div className="py-2.5 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Predicted Stenosis Risk:
            </span>
            <span
              className="text-lg font-mono font-extrabold"
              style={{ color: vessel.color }}
            >
              {vessel.risk}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(5, Math.min(100, vessel.risk))}%`,
                backgroundColor: vessel.color,
                boxShadow: `0 0 8px ${vessel.color}`,
              }}
            />
          </div>

          <div
            className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-center border"
            style={{
              color: vessel.color,
              borderColor: vessel.color + '40',
              backgroundColor: vessel.color + '15',
            }}
          >
            {vessel.status}
          </div>
        </div>

        {/* Anatomical Details */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80 text-[11px]">
          <div>
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
              Myocardial Territory:
            </span>
            <p className="text-slate-300 leading-snug mt-0.5">
              {vessel.territory}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block">
              Clinical Significance:
            </span>
            <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">
              {vessel.clinicalNote}
            </p>
          </div>
        </div>

        {/* Vessel Switch Tabs */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className="text-slate-500">Quick Switch:</span>
          <div className="flex gap-1">
            {(['LAD', 'LCX', 'RCA'] as VesselCode[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSelectCode(c)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  vessel.code === c
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component Export ────────────────────────────────────────────────────
export const HeartCanvas3D: React.FC<HeartCanvas3DProps> = ({
  patient,
  prediction,
  isSimulating,
}) => {
  const isPredicted = prediction !== null && !isSimulating;
  const [viewAngle, setViewAngle] = useState<ViewAngle>('anterior');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Clear selected vessel when simulation resets
  useEffect(() => {
    if (!isPredicted) {
      setSelectedVessel(null);
    }
  }, [isPredicted]);

  // Keep selected vessel data up to date if prediction changes
  useEffect(() => {
    if (selectedVessel) {
      setSelectedVessel(buildVesselData(selectedVessel.code, prediction, patient));
    }
  }, [prediction, patient]);

  const handleSelectCode = useCallback(
    (code: VesselCode) => {
      setSelectedVessel(buildVesselData(code, prediction, patient));
      if (code === 'LAD') setViewAngle('anterior');
      if (code === 'LCX') setViewAngle('lateral');
      if (code === 'RCA') setViewAngle('inferior');
    },
    [prediction, patient]
  );

  const handleViewAngle = useCallback(
    (angle: ViewAngle) => {
      setViewAngle(angle);
      if (angle === 'anterior') handleSelectCode('LAD');
      if (angle === 'lateral') handleSelectCode('LCX');
      if (angle === 'inferior') handleSelectCode('RCA');
    },
    [handleSelectCode]
  );

  return (
    <div className="relative w-full h-full flex flex-col rounded-xl border border-amber-500/20 bg-[#080B10]/95 shadow-[0_0_35px_rgba(245,158,11,0.06)] overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-5 py-3 border-b border-amber-500/10 bg-[#0B0F17]/80 backdrop-blur-md shrink-0">
        <span className="font-serif tracking-widest text-xs uppercase text-amber-200/90 font-medium">
          {isPredicted
            ? '[Interactive 3D Heart Model · Coronary Perfusion]'
            : '[3D Anatomical Projection · Parameter Entry Stage]'}
        </span>
        {isPredicted ? (
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-md border border-slate-800 text-[11px] font-sans">
            <button
              type="button"
              onClick={() => handleViewAngle('anterior')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewAngle === 'anterior'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Anterior (LAD)
            </button>
            <button
              type="button"
              onClick={() => handleViewAngle('lateral')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewAngle === 'lateral'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lateral (LCX)
            </button>
            <button
              type="button"
              onClick={() => handleViewAngle('inferior')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewAngle === 'inferior'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inferior (RCA)
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Interactive 3D View · Drag to Rotate</span>
          </div>
        )}
      </div>

      {/* ── 3D Canvas Area ───────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full min-h-0 cursor-grab active:cursor-grabbing">
        {/* DOM loading overlay */}
        {isLoading && <DOMLoader />}

        {/* React Three Fiber Canvas */}
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 45, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          shadows
          onPointerMissed={() => setSelectedVessel(null)}
        >
          <CameraAnimator
            isPredicted={isPredicted}
            viewAngle={viewAngle}
            controlsRef={controlsRef}
          />
          <CanvasLoaderBridge onLoading={setIsLoading} />

          {/* Clean Medical Studio Lighting */}
          <ambientLight intensity={0.7} color="#334155" />
          <directionalLight position={[5, 8, 5]} intensity={2.6} color="#ffffff" castShadow />
          <pointLight position={[-4, -2, 3]} intensity={1.5} color="#38bdf8" />
          <directionalLight position={[0, -4, -3]} intensity={0.9} color="#64748b" />

          {/* Subtle Environment Reflection */}
          <Environment preset="studio" backgroundIntensity={0} />

          {/* Soft Ground Shadow */}
          <ContactShadows
            position={[0, -1.9, 0]}
            opacity={0.35}
            scale={7}
            blur={2}
            far={3.5}
            color="#0284c7"
          />

          {/* Torso Model: Rendered when NOT predicted */}
          {!isPredicted && (
            <Suspense fallback={null}>
              <TorsoModel />
            </Suspense>
          )}

          {/* Heart Model: Rendered when predicted */}
          {isPredicted && (
            <Suspense fallback={null}>
              <HeartModel
                prediction={prediction}
                patient={patient}
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
              />
            </Suspense>
          )}

          {/* Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            enableZoom
            enablePan={false}
            autoRotate={!isPredicted}
            autoRotateSpeed={0.5}
            minDistance={1.8}
            maxDistance={7.5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.3}
            makeDefault
          />
        </Canvas>

        {/* ── Top-Right HUD Overlay (Only shown post-prediction) ────── */}
        {isPredicted && (
          selectedVessel ? (
            <VesselDetailPopup
              vessel={selectedVessel}
              onClose={() => setSelectedVessel(null)}
              onSelectCode={handleSelectCode}
            />
          ) : (
            <CoronarySummaryBadge
              prediction={prediction}
              patient={patient}
              onSelectCode={handleSelectCode}
            />
          )
        )}

        {/* Bottom Click Hint */}
        {isPredicted && !selectedVessel && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <p className="text-[10px] font-mono text-slate-400 bg-slate-900/70 border border-slate-800 px-3 py-1 rounded-full shadow-lg tracking-wider animate-pulse">
              Click a coronary vessel on the 3D heart or top-right card to inspect
            </p>
          </div>
        )}

        {/* Predictive Simulation In-Flight Spinner */}
        {isSimulating && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B10]/75 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 p-5 rounded-xl bg-[#0B0F17]/95 border border-amber-500/40 shadow-2xl">
              <div className="w-8 h-8 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
              <span className="font-serif tracking-widest text-xs uppercase text-amber-200">
                Running Predictive Simulation...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
