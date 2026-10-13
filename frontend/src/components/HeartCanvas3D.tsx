'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Activity, RotateCcw } from 'lucide-react';
import { PatientClinicalData, PredictionResult } from '../types/medical';

interface HeartCanvas3DProps {
  patient: PatientClinicalData;
  prediction: PredictionResult | null;
  isSimulating: boolean;
}

export const HeartCanvas3D: React.FC<HeartCanvas3DProps> = ({
  patient,
  prediction,
  isSimulating,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);

  const [viewAngle, setViewAngle] = useState<'anterior' | 'lateral' | 'inferior'>('anterior');

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stenosis statuses
  const ladStenotic = prediction ? prediction.ladStenosisRisk > 50 : patient.ladProximal === 'Stenotic';
  const lcxStenotic = prediction ? prediction.lcxStenosisRisk > 50 : patient.lcxProximal === 'Stenotic';
  const rcaStenotic = prediction ? prediction.rcaStenosisRisk > 50 : patient.rcaProximal === 'Stenotic';

  const bpm = patient.pr || 72;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Subtle, warm cinematic lights (Removes harsh neon blues)
    const ambientLight = new THREE.AmbientLight(0x1a202c, 2.0);
    scene.add(ambientLight);

    const warmKeyLight = new THREE.DirectionalLight(0xfef3c7, 1.8);
    warmKeyLight.position.set(4, 6, 6);
    scene.add(warmKeyLight);

    const softFillLight = new THREE.PointLight(0xd97706, 1.2, 15);
    softFillLight.position.set(-5, -3, 3);
    scene.add(softFillLight);

    const rimLight = new THREE.DirectionalLight(0x64748b, 0.8);
    rimLight.position.set(0, -5, -4);
    scene.add(rimLight);

    // 5. Anatomical Heart Geometry (Rich, organic, warm tones)
    const heartGroup = new THREE.Group();
    heartGroupRef.current = heartGroup;
    scene.add(heartGroup);

    // Ventricles Geometry
    const ventricleGeo = new THREE.SphereGeometry(1.85, 48, 48);
    const pos = ventricleGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      if (y < 0) {
        x *= 1 + y * 0.28;
        z *= 1 + y * 0.28;
      }
      y *= 1.15;
      x *= 0.95;

      pos.setXYZ(i, x, y, z);
    }
    ventricleGeo.computeVertexNormals();

    const heartMat = new THREE.MeshStandardMaterial({
      color: 0x450a0a, // Deep anatomical burgundy
      emissive: 0x2e0808,
      emissiveIntensity: 0.2,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.95,
    });

    const heartMesh = new THREE.Mesh(ventricleGeo, heartMat);
    heartMesh.name = 'ventricles';
    heartMesh.rotation.z = -0.15;
    heartGroup.add(heartMesh);

    // Aortic Arch
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 1.2, 0),
      new THREE.Vector3(0.2, 2.3, -0.2),
      new THREE.Vector3(-0.6, 2.6, -0.3),
      new THREE.Vector3(-1.3, 2.1, -0.4),
      new THREE.Vector3(-1.4, 0.8, -0.5),
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 40, 0.38, 16, false);
    const aortaMat = new THREE.MeshStandardMaterial({
      color: 0x581c87, // Deep vascular trunk
      emissive: 0x3b0764,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.3,
    });
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    heartGroup.add(aortaMesh);

    // 6. Coronary Arteries (Warm gold when patent, crimson when stenotic)
    const arteriesGroup = new THREE.Group();
    heartGroup.add(arteriesGroup);

    // LAD
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 1.3, 1.2),
      new THREE.Vector3(0.1, 0.6, 1.6),
      new THREE.Vector3(0.25, -0.2, 1.55),
      new THREE.Vector3(0.35, -1.0, 1.25),
      new THREE.Vector3(0.2, -1.8, 0.6),
    ]);
    const ladGeo = new THREE.TubeGeometry(ladCurve, 32, 0.08, 12, false);
    const ladMat = new THREE.MeshStandardMaterial({
      color: ladStenotic ? 0xef4444 : 0xf59e0b,
      emissive: ladStenotic ? 0xb91c1c : 0xd97706,
      emissiveIntensity: ladStenotic ? 1.5 : 0.8,
      roughness: 0.25,
      metalness: 0.6,
    });
    const ladMesh = new THREE.Mesh(ladGeo, ladMat);
    arteriesGroup.add(ladMesh);

    // LCX
    const lcxCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 1.3, 1.2),
      new THREE.Vector3(-0.7, 0.9, 1.1),
      new THREE.Vector3(-1.4, 0.4, 0.5),
      new THREE.Vector3(-1.6, -0.3, -0.4),
      new THREE.Vector3(-1.3, -1.1, -0.9),
    ]);
    const lcxGeo = new THREE.TubeGeometry(lcxCurve, 32, 0.075, 12, false);
    const lcxMat = new THREE.MeshStandardMaterial({
      color: lcxStenotic ? 0xef4444 : 0xfbbf24,
      emissive: lcxStenotic ? 0xb91c1c : 0xb45309,
      emissiveIntensity: lcxStenotic ? 1.5 : 0.7,
      roughness: 0.25,
      metalness: 0.6,
    });
    const lcxMesh = new THREE.Mesh(lcxGeo, lcxMat);
    arteriesGroup.add(lcxMesh);

    // RCA
    const rcaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 1.2, 0.9),
      new THREE.Vector3(1.1, 0.7, 0.8),
      new THREE.Vector3(1.5, -0.1, 0.2),
      new THREE.Vector3(1.3, -0.9, -0.6),
      new THREE.Vector3(0.5, -1.6, -0.8),
    ]);
    const rcaGeo = new THREE.TubeGeometry(rcaCurve, 32, 0.075, 12, false);
    const rcaMat = new THREE.MeshStandardMaterial({
      color: rcaStenotic ? 0xef4444 : 0xf59e0b,
      emissive: rcaStenotic ? 0xb91c1c : 0xd97706,
      emissiveIntensity: rcaStenotic ? 1.5 : 0.8,
      roughness: 0.25,
      metalness: 0.6,
    });
    const rcaMesh = new THREE.Mesh(rcaGeo, rcaMat);
    arteriesGroup.add(rcaMesh);

    // Mouse Interaction for 3D Orbit Dragging
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !heartGroupRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      heartGroupRef.current.rotation.y += deltaX * 0.008;
      heartGroupRef.current.rotation.x += deltaY * 0.008;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      e.preventDefault();
      cameraRef.current.position.z = Math.min(12, Math.max(4.8, cameraRef.current.position.z + e.deltaY * 0.005));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 7. Organic Beating Cycle
    const startTime = performance.now();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Convert bpm into pulse cycle
      const freq = bpm / 60;
      const beatPhase = (elapsedTime * freq * Math.PI * 2) % (Math.PI * 2);

      const contraction =
        Math.pow(Math.sin(beatPhase), 16) * 0.08 +
        Math.pow(Math.sin(beatPhase + 0.4), 24) * 0.04;

      if (heartGroupRef.current) {
        const baseScale = 1 + contraction;
        heartGroupRef.current.scale.set(baseScale, baseScale, baseScale);

        if (!isDragging) {
          heartGroupRef.current.rotation.y += 0.0025;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [bpm, ladStenotic, lcxStenotic, rcaStenotic]);

  // View Angle switch
  const setCameraView = (angle: 'anterior' | 'lateral' | 'inferior') => {
    setViewAngle(angle);
    if (!heartGroupRef.current) return;
    switch (angle) {
      case 'anterior':
        heartGroupRef.current.rotation.set(0, 0, 0);
        break;
      case 'lateral':
        heartGroupRef.current.rotation.set(0.1, -Math.PI / 2.2, 0);
        break;
      case 'inferior':
        heartGroupRef.current.rotation.set(-Math.PI / 3, 0, 0);
        break;
    }
  };

  // Live ECG Canvas
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 0;
    let ecgAnimationId: number;
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const stElevated = patient.stElevation === '1';
    const stDepressed = patient.stDepression === '1';

    const points: number[] = [];
    const stepCount = 60;

    for (let i = 0; i < stepCount; i++) {
      let y = 0;
      if (i === 10) y = -5;
      if (i === 18) y = 3;
      if (i === 20) y = -22;
      if (i === 22) y = 6;
      if (i >= 24 && i <= 34) {
        if (stElevated) y = -8;
        else if (stDepressed) y = 6;
        else y = 0;
      }
      if (i === 40) {
        y = patient.tinversion === '1' ? 7 : -6;
      }
      points.push(midY + y);
    }

    ctx.fillStyle = 'rgba(8, 11, 16, 0.95)';
    ctx.fillRect(0, 0, width, height);

    let pointIndex = 0;

    const drawECG = () => {
      ctx.fillStyle = 'rgba(8, 11, 16, 0.08)';
      ctx.fillRect(0, 0, width, height);

      const currentY = points[pointIndex % points.length];
      pointIndex++;

      ctx.strokeStyle = stElevated ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      ctx.arc(x, currentY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      x = (x + 2.5) % width;
      if (x === 0) {
        ctx.fillRect(0, 0, width, height);
      }

      ecgAnimationId = requestAnimationFrame(drawECG);
    };

    drawECG();

    return () => {
      cancelAnimationFrame(ecgAnimationId);
    };
  }, [patient.stElevation, patient.stDepression, patient.tinversion]);

  return (
    <div className="relative w-full h-full flex flex-col rounded-xl border border-amber-500/20 bg-[#080B10]/90 shadow-[0_0_35px_rgba(245,158,11,0.06)] overflow-hidden">
      {/* Header Bar with Centered Label (Cleaned up, no techno-babble) */}
      <div className="relative z-20 flex items-center justify-between px-5 py-3 border-b border-amber-500/10 bg-[#0B0F17]/70 backdrop-blur-sm">
        {/* Centered Required Label */}
        <div className="flex items-center gap-2">
          <span className="font-serif tracking-widest text-xs uppercase text-amber-200/90 font-medium">
            [Interactive 3D Heart Model & Real-Time Risk Canvas]
          </span>
        </div>

        {/* Minimal perspective selector pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-md border border-slate-800 text-[11px] font-sans">
          <button
            type="button"
            onClick={() => setCameraView('anterior')}
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
            onClick={() => setCameraView('lateral')}
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
            onClick={() => setCameraView('inferior')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              viewAngle === 'inferior'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inferior (RCA)
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative flex-1 w-full h-full min-h-[440px] cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />

        {/* Top-Right: Discreet Coronary Stenosis Summary Badge */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
          <div className="bg-[#0B0F17]/85 border border-slate-800 rounded-lg p-2.5 backdrop-blur-md shadow-lg font-sans text-xs space-y-1 w-44">
            <span className="font-serif tracking-wider text-[10px] uppercase text-amber-200/80 block mb-1">
              Coronary Perfusion
            </span>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">LAD:</span>
              <span className={ladStenotic ? 'text-rose-400 font-medium' : 'text-amber-200'}>
                {prediction ? `${prediction.ladStenosisRisk}% Risk` : ladStenotic ? 'Stenotic' : 'Patent'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">LCX:</span>
              <span className={lcxStenotic ? 'text-rose-400 font-medium' : 'text-amber-200'}>
                {prediction ? `${prediction.lcxStenosisRisk}% Risk` : lcxStenotic ? 'Stenotic' : 'Patent'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">RCA:</span>
              <span className={rcaStenotic ? 'text-rose-400 font-medium' : 'text-amber-200'}>
                {prediction ? `${prediction.rcaStenosisRisk}% Risk` : rcaStenotic ? 'Stenotic' : 'Patent'}
              </span>
            </div>
          </div>
        </div>

        {/* Prediction Result Overlay Pill (When calculated) */}
        {prediction && !isSimulating && (
          <div className="absolute bottom-16 left-5 right-5 z-20 pointer-events-auto">
            <div className="p-3.5 rounded-lg bg-[#0B0F17]/95 border border-amber-500/30 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1.5 rounded-md font-mono text-sm font-bold border ${
                    prediction.overallRiskScore >= 50
                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  }`}
                >
                  {prediction.overallRiskScore}%
                </div>
                <div>
                  <div className="font-serif tracking-wider text-xs uppercase text-amber-100 font-semibold">
                    CAD Likelihood: {prediction.riskCategory}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Vessels at Risk: {prediction.predictedVessels} of 3 | Diagnosis: {prediction.cathDiagnosis}
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-500">
                Pulse: {patient.pr} bpm | EF: {patient.efTte}%
              </div>
            </div>
          </div>
        )}

        {/* Simulation Scan Overlay */}
        {isSimulating && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B10]/70 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 p-5 rounded-xl bg-[#0B0F17]/95 border border-amber-500/40 shadow-2xl">
              <div className="w-8 h-8 rounded-full border-2 border-amber-300 border-t-transparent animate-spin" />
              <span className="font-serif tracking-widest text-xs uppercase text-amber-200">
                Running Predictive Simulation...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Oscilloscope Waveform at Base */}
      <div className="relative z-20 h-12 w-full border-t border-amber-500/10 bg-[#080B10]/95 flex items-center px-4 overflow-hidden">
        <span className="text-[10px] font-serif uppercase tracking-wider text-slate-500 pr-3 border-r border-slate-800 whitespace-nowrap">
          Lead II ECG
        </span>
        <canvas
          ref={ecgCanvasRef}
          width={650}
          height={48}
          className="w-full h-full object-cover px-2"
        />
        <span className="text-[10px] font-mono text-slate-400 pl-3 border-l border-slate-800 whitespace-nowrap">
          {patient.pr} BPM
        </span>
      </div>
    </div>
  );
};
