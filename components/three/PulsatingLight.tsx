"use client";

import { useMemo, useRef } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";

function makeBackdropTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, "#e4d3ff");
  gradient.addColorStop(0.14, "#9d6bff");
  gradient.addColorStop(0.3, "#8a5cff");
  gradient.addColorStop(0.48, "#3a1785");
  gradient.addColorStop(0.65, "rgba(20, 10, 45, 0)");
  gradient.addColorStop(1, "rgba(20, 10, 45, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeRaysTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  ctx.translate(c, c);

  const rayCount = 14;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const halfWidthDeg = 5 + ((i * 37) % 11);
    const halfWidth = (halfWidthDeg * Math.PI) / 180;
    const length = c * (0.68 + ((i * 53) % 30) / 100);

    ctx.save();
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -length);
    grad.addColorStop(0, "rgba(228, 211, 255, 0.85)");
    grad.addColorStop(0.25, "rgba(138, 92, 255, 0.5)");
    grad.addColorStop(0.65, "rgba(58, 23, 133, 0.18)");
    grad.addColorStop(1, "rgba(58, 23, 133, 0)");

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-Math.sin(halfWidth) * length, -Math.cos(halfWidth) * length);
    ctx.lineTo(Math.sin(halfWidth) * length, -Math.cos(halfWidth) * length);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export default function PulsatingLight() {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const raysMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const rays = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  const texture = useMemo(() => makeBackdropTexture(), []);
  const raysTexture = useMemo(() => makeRaysTexture(), []);

  useFrame((_, delta) => {
    t.current += delta;
    const breathe = 0.5 + Math.sin(t.current * 1.4) * 0.3;
    const scrollBoost = scrollState.heroProgress;

    if (material.current) {
      material.current.opacity = 0.16 + breathe * 0.32 + scrollBoost * 0.18;
    }
    if (mesh.current) {
      const scale = 1 + breathe * 0.12 + scrollBoost * 0.1;
      mesh.current.scale.setScalar(scale);
    }
    if (raysMaterial.current) {
      raysMaterial.current.opacity = 0.12 + breathe * 0.18 + scrollBoost * 0.14;
    }
    if (rays.current) {
      rays.current.rotation.z = t.current * 0.045;
      const scale = 1 + breathe * 0.06 + scrollBoost * 0.08;
      rays.current.scale.setScalar(scale);
    }
    if (light.current) {
      light.current.intensity = 0.35 + breathe * 0.45 + scrollBoost * 0.4;
    }
  });

  return (
    <>
      <Billboard position={[0, -0.195, -1.85]}>
        <mesh ref={rays}>
          <planeGeometry args={[7.5, 7.5]} />
          <meshBasicMaterial
            ref={raysMaterial}
            map={raysTexture}
            transparent
            depthWrite={false}
            toneMapped={false}
            fog={false}
            blending={THREE.AdditiveBlending}
            opacity={0.2}
          />
        </mesh>
      </Billboard>
      <Billboard position={[0, -0.195, -1.8]}>
        <mesh ref={mesh}>
          <planeGeometry args={[5.2, 5.2]} />
          <meshBasicMaterial
            ref={material}
            map={texture}
            transparent
            depthWrite={false}
            toneMapped={false}
            fog={false}
            blending={THREE.AdditiveBlending}
            opacity={0.32}
          />
        </mesh>
      </Billboard>
      <pointLight
        ref={light}
        color="#8a5cff"
        position={[0, -0.145, -1.7]}
        intensity={0.35}
        distance={2.6}
        decay={2}
      />
    </>
  );
}
