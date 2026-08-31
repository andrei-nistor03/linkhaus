"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { contactState } from "@/lib/contactState";

interface ContactParticlesProps {
  count: number;
}

const REPEL_RADIUS = 1.4;
const REPEL_STRENGTH = 2.6;
const DAMPING = 0.9;
const DRIFT_SPEED = 0.06;

/** Soft round sprite, drawn once to a small canvas — the same
 *  "canvas-texture-as-glow" technique PulsatingLight.tsx uses for its own
 *  billboarded planes, here at dot scale. */
function makeDotTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, "rgba(245,243,238,0.9)");
  gradient.addColorStop(0.4, "rgba(200,180,255,0.5)");
  gradient.addColorStop(1, "rgba(138,92,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * A field of soft glowing dots drifting slowly upward through the Contact
 * backdrop, wandering the full width of the environment (each one keeps its
 * own sine-driven horizontal path, not just a straight climb) and gently
 * repelled by the cursor — a velocity-based push + damping, not a direct
 * position snap, so the reaction reads as smooth interpolation rather than
 * particles rigidly tracking the mouse. Deliberately never pulled toward any
 * one point (an earlier version drew them inward late in the scroll as a
 * "converge on the CTA" beat — it read as clutter, not atmosphere, so it's
 * gone: these just keep floating).
 *
 * Positions live in a plain Float32Array mutated directly each frame — a
 * React-managed array of point objects would mean recreating the whole
 * buffer every tick for a couple hundred points doing nothing but drifting.
 */
export default function ContactParticles({ count }: ContactParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 2);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = -1 - Math.random() * 2.5;
      velocities[i * 2] = 0;
      velocities[i * 2 + 1] = 0;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, velocities, phases };
  }, [count]);

  const texture = useMemo(() => makeDotTexture(), []);

  useFrame((state, rawDelta) => {
    const points = pointsRef.current;
    if (!points) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;
    const vp = state.viewport;
    const pointerWorld = {
      x: (contactState.pointerEased.x * vp.width) / 2,
      y: (contactState.pointerEased.y * vp.height) / 2,
    };

    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const bound = vp.height / 2 + 1;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const px = positions[ix];
      const py = positions[ix + 1];

      // Sine wander — two mismatched frequencies per particle (each keyed
      // off its own phase, so none of them sync up) rather than one, so the
      // path each dot idles along reads as a lazy meander across the width
      // of the field instead of a small bob in place.
      const wobble =
        Math.sin(t * 0.17 + phases[i]) * 0.006 + Math.sin(t * 0.06 + phases[i] * 1.7) * 0.0045;
      let vx = velocities[i * 2] + wobble;
      let vy = velocities[i * 2 + 1] + DRIFT_SPEED * delta;

      const dx = px - pointerWorld.x;
      const dy = py - pointerWorld.y;
      const dist = Math.hypot(dx, dy);
      if (dist < REPEL_RADIUS && dist > 0.0001) {
        const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH * delta;
        vx += (dx / dist) * push;
        vy += (dy / dist) * push;
      }

      vx *= DAMPING;
      vy *= DAMPING;
      velocities[i * 2] = vx;
      velocities[i * 2 + 1] = vy;

      let nx = px + vx;
      let ny = py + vy;
      if (ny > bound) {
        ny = -bound;
        nx = (Math.random() - 0.5) * vp.width;
      }

      positions[ix] = nx;
      positions[ix + 1] = ny;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.16}
        sizeAttenuation
        transparent
        depthWrite={false}
        toneMapped={false}
        opacity={0.55}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
