'use client';

import React from 'react';
import { InteractiveNebulaShader } from './ui/liquid-shader';

/**
 * LiquidShaderBackground
 *
 * Wraps the InteractiveNebulaShader (Three.js ray-marched nebula)
 * as a subtle ambient background behind the left parameter panel.
 * Uses disableCenterDimming=true so the panel content remains readable.
 */
export const LiquidShaderBackground: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.55,
        borderRadius: 'inherit',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <InteractiveNebulaShader
        hasActiveReminders={false}
        hasUpcomingReminders={false}
        disableCenterDimming={true}
      />
    </div>
  );
};
