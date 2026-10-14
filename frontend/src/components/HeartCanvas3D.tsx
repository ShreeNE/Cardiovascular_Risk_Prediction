'use client';

import React, { useEffect, useRef, useState, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useThree, ThreeEvent, useFrame } from '@react-three/fiber';
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
  color: string;        // dark (default / unselected)
  activeColor: string;  // light/bright (selected / active)
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
      color: '#7f1d1d',       // Dark red (default / unselected)
      activeColor: '#ef4444', // Bright red (selected / active)
      emissive: '#7f1d1d',
      emissiveIntensity: 0.06,
      status: 'Severe Stenosis (High Risk)',
      badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    };
  }
  if (risk >= 50) {
    return {
      color: '#854d0e',       // Deep gold/ochre (default / unselected) — not brownish
      activeColor: '#fbbf24', // Bright gold/yellow (selected / active)
      emissive: '#854d0e',
      emissiveIntensity: 0.06,
      status: 'Moderate Stenosis (Elevated)',
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    };
  }
  return {
    color: '#14532d',       // Dark green (default / unselected)
    activeColor: '#22c55e', // Bright green (selected / active)
    emissive: '#14532d',
    emissiveIntensity: 0.06,
    status: 'Patent / Healthy Perfusion',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };
}

// ─── Build Vessel Info ────────────────────────────────────────────────────────
function buildVesselData(
  code: VesselCode,
  prediction: PredictionResult | null,
  patient?: PatientClinicalData | null
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
      fallback: patient?.ladProximal ?? 'Normal',
    },
    LCX: {
      key: 'Vessel_LCX',
      name: 'Left Circumflex',
      subname: 'Left Circumflex Branch',
      territory: 'Posterolateral left ventricle, lateral free wall, and left atrium.',
      clinicalNote:
        'Occlusion causes lateral MI, often presenting with subtle or non-diagnostic ECG changes requiring heightened clinical suspicion.',
      riskVal: prediction?.lcxStenosisRisk,
      fallback: patient?.lcxProximal ?? 'Normal',
    },
    RCA: {
      key: 'Vessel_RCA',
      name: 'Right Coronary Artery',
      subname: 'Main RCA & Posterior Descending (PDA)',
      territory: 'Right ventricle, inferior LV wall, posterior 1/3 of septum, SA node (60%) and AV node (90%).',
      clinicalNote:
        'Inferior STEMI frequently accompanies RV infarction, severe bradyarrhythmias, and high-degree AV conduction blocks.',
      riskVal: prediction?.rcaStenosisRisk,
      fallback: patient?.rcaProximal ?? 'Normal',
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
    color: colorCfg.color,           // dark (default)
    activeColor: colorCfg.activeColor, // bright (selected)
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
  onSelectCode: (code: VesselCode) => void;
}

function HeartModel({
  prediction,
  patient,
  selectedVessel,
  onSelectVessel,
  onSelectCode,
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

      // Skip internal outline meshes to preserve their custom shader
      if (meshName.startsWith('__')) return;

      if (vesselColorMap[meshName]) {
        const cfg = vesselColorMap[meshName];
        const isSelected = selectedVessel?.key === meshName;
        const isHovered = hoveredVessel === meshName;

        // Default = dark color; selected/active = bright color
        const displayColor = isSelected ? cfg.activeColor : cfg.color;

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(displayColor),
          emissive: new THREE.Color(displayColor),
          emissiveIntensity: isSelected ? 0.25 : isHovered ? 0.15 : 0.05,
          roughness: 0.45,
          metalness: 0.1,
        });
        mesh.material = mat;
      } else if (meshName === 'Object_151' || meshName === 'Object_152') {
        // Anatomical cardiac muscle (natural red myocardium)
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#9e2a2b'),
          roughness: 0.5,
          metalness: 0.05,
        });
        mesh.renderOrder = 0;
      } else if (meshName === 'Object_123' || meshName === 'Object_148') {
        // Aorta and pulmonary trunk
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#b91c1c'),
          roughness: 0.35,
          metalness: 0.1,
        });
        mesh.renderOrder = 0;
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
        mesh.renderOrder = 0;
      } else if (meshName === 'Object_149' || meshName === 'Object_150') {
        // Coronary sulci / connective tissue (toned to rich anatomical tissue, not stark white)
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#782828'),
          roughness: 0.6,
          metalness: 0.05,
        });
        mesh.renderOrder = 0;
      } else if (meshName === 'Object_3') {
        // Valvular annulus / cartilage
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#cbd5e1'),
          roughness: 0.5,
          metalness: 0.05,
        });
        mesh.renderOrder = 0;
      } else {
        // General anatomical tissue
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#9e2a2b'),
          roughness: 0.5,
          metalness: 0.05,
        });
        mesh.renderOrder = 0;
      }
    });
  }, [scene, prediction, patient, selectedVessel, hoveredVessel]);

  // Click handler: selecting a vessel also rotates camera to look directly at it
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const meshName = e.object.name;

      if (meshName === 'Vessel_LAD') {
        onSelectCode('LAD');
      } else if (meshName === 'Vessel_LCX') {
        onSelectCode('LCX');
      } else if (meshName === 'Vessel_RCA') {
        onSelectCode('RCA');
      } else {
        // Clicking cardiac muscle or background deselects
        onSelectVessel(null);
      }
    },
    [onSelectCode, onSelectVessel]
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
    // Exact camera positions and focus targets computed for each vessel
    const targetCam = isPredicted
      ? viewAngle === 'anterior'
        ? { x: 1.2, y: 0.1, z: 3.9 } // Faces anterior interventricular groove (LAD)
        : viewAngle === 'lateral'
        ? { x: 3.6, y: 0.2, z: -1.6 } // Faces left lateral / posterior groove (LCX)
        : { x: -2.6, y: 0.4, z: 3.1 } // Faces right coronary sulcus (RCA)
      : { x: 0, y: 0, z: 4.2 };

    const targetLook = isPredicted
      ? viewAngle === 'anterior'
        ? { x: 0.25, y: -0.05, z: 0.2 } // Centers LAD
        : viewAngle === 'lateral'
        ? { x: 0.35, y: 0.0, z: -0.1 } // Centers LCX
        : { x: -0.1, y: -0.1, z: 0.15 } // Centers RCA
      : { x: 0, y: 0, z: 0 };

    const isInitial =
      prevPredicted.current !== isPredicted ||
      prevViewAngle.current !== viewAngle;

    if (isInitial) {
      prevPredicted.current = isPredicted;
      prevViewAngle.current = viewAngle;

      gsap.to(camera.position, {
        x: targetCam.x,
        y: targetCam.y,
        z: targetCam.z,
        duration: 1.2,
        ease: 'power3.inOut',
      });

      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: targetLook.x,
          y: targetLook.y,
          z: targetLook.z,
          duration: 1.2,
          ease: 'power3.inOut',
          onUpdate: () => {
            controlsRef.current?.update();
          },
        });
      }
    }
  }, [isPredicted, viewAngle, camera, controlsRef]);

  return null;
}

// ─── Top-Right Coronary Perfusion Summary Badge (Default) ──────────────────────
interface SummaryBadgeProps {
  prediction: PredictionResult | null;
  patient: PatientClinicalData;
  onSelectCode: (code: VesselCode) => void;
  selectedCode: VesselCode | null;
}

function CoronarySummaryBadge({
  prediction,
  patient,
  onSelectCode,
  selectedCode,
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
          {vessels.map(({ code, data }) => {
            const isActive = selectedCode === code;
            const dotColor = isActive ? data.activeColor : data.color;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onSelectCode(code)}
                style={isActive ? {
                  borderColor: `${data.activeColor}50`,
                  backgroundColor: `${data.activeColor}12`,
                } : undefined}
                className="w-full flex items-center justify-between px-2 py-1 rounded-md bg-slate-900/50 hover:bg-slate-800/70 border border-transparent hover:border-slate-700/60 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className="font-mono text-[11px] font-semibold" style={{ color: isActive ? data.activeColor : '#cbd5e1' }}>
                    {code}
                  </span>
                </div>
                <span
                  className="font-mono text-[11px] font-medium"
                  style={{ color: dotColor }}
                >
                  {data.risk}% Risk
                </span>
              </button>
            );
          })}
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
  prediction: PredictionResult | null;
  patient: PatientClinicalData;
}

function VesselDetailPopup({
  vessel,
  onClose,
  onSelectCode,
  prediction,
  patient,
}: DetailPopupProps) {
  return (
    <div className="absolute top-4 right-4 z-30 pointer-events-auto">
      <div
        className="w-80 rounded-xl border backdrop-blur-xl shadow-2xl p-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-200"
        style={{
          borderColor: vessel.activeColor + '70',
          backgroundColor: '#0B0F17F5',
          boxShadow: `0 10px 30px -5px ${vessel.activeColor}25, 0 0 15px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 animate-ping"
                style={{ backgroundColor: vessel.activeColor }}
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
              style={{ color: vessel.activeColor }}
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
                backgroundColor: vessel.activeColor,
                boxShadow: `0 0 8px ${vessel.activeColor}`,
              }}
            />
          </div>

          <div
            className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-center border"
            style={{
              color: vessel.activeColor,
              borderColor: vessel.activeColor + '40',
              backgroundColor: vessel.activeColor + '15',
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
            {(['LAD', 'LCX', 'RCA'] as VesselCode[]).map((c) => {
              const cData = buildVesselData(c, prediction, patient);
              const isActive = vessel.code === c;
              const tabColor = isActive ? cData.activeColor : cData.color;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSelectCode(c)}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${cData.activeColor}25`,
                          color: cData.activeColor,
                          borderColor: `${cData.activeColor}70`,
                        }
                      : {
                          borderColor: `${cData.color}40`,
                          color: cData.color,
                        }
                  }
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    isActive
                      ? 'font-bold'
                      : 'hover:opacity-80 bg-slate-900/60'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tabColor }}
                  />
                  <span>{c}</span>
                </button>
              );
            })}
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

  // Pre-calculate vessel metrics for synchronized coloring across buttons and 3D
  const ladVessel = useMemo(() => buildVesselData('LAD', prediction, patient), [prediction, patient]);
  const lcxVessel = useMemo(() => buildVesselData('LCX', prediction, patient), [prediction, patient]);
  const rcaVessel = useMemo(() => buildVesselData('RCA', prediction, patient), [prediction, patient]);

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
      if (angle === 'anterior') setSelectedVessel(buildVesselData('LAD', prediction, patient));
      if (angle === 'lateral') setSelectedVessel(buildVesselData('LCX', prediction, patient));
      if (angle === 'inferior') setSelectedVessel(buildVesselData('RCA', prediction, patient));
    },
    [prediction, patient]
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
            {[
              { angle: 'anterior' as ViewAngle, code: 'LAD' as VesselCode, label: 'Anterior (LAD)', data: ladVessel },
              { angle: 'lateral' as ViewAngle, code: 'LCX' as VesselCode, label: 'Lateral (LCX)', data: lcxVessel },
              { angle: 'inferior' as ViewAngle, code: 'RCA' as VesselCode, label: 'Inferior (RCA)', data: rcaVessel },
            ].map(({ angle, label, data }) => {
              const isActive = viewAngle === angle;
              const btnColor = isActive ? data.activeColor : data.color;
              return (
                <button
                  key={angle}
                  type="button"
                  onClick={() => handleViewAngle(angle)}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${data.activeColor}22`,
                          color: data.activeColor,
                          borderColor: `${data.activeColor}70`,
                          boxShadow: `0 0 12px ${data.activeColor}25`,
                        }
                      : {
                          borderColor: 'transparent',
                          color: data.color,
                        }
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all cursor-pointer font-medium ${
                    isActive
                      ? ''
                      : 'hover:opacity-80 hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse' : 'opacity-70'}`}
                    style={{ backgroundColor: btnColor }}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
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
                onSelectCode={handleSelectCode}
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
              prediction={prediction}
              patient={patient}
            />
          ) : (
            <CoronarySummaryBadge
              prediction={prediction}
              patient={patient}
              onSelectCode={handleSelectCode}
              selectedCode={null}
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
