"use client";

import { useEffect, useMemo, useRef } from "react";
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
  useEffect(() => () => texture.dispose(), [texture]);

  const pointerWorld = useRef({ x: 0, y: 0 }).current;

  useFrame((state, rawDelta) => {
    const points = pointsRef.current;
    if (!points) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime;
    const vp = state.viewport;
    pointerWorld.x = (contactState.pointerEased.x * vp.width) / 2;
    pointerWorld.y = (contactState.pointerEased.y * vp.height) / 2;

    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const bound = vp.height / 2 + 1;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const px = positions[ix];
      const py = positions[ix + 1];

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
