"use client";

import { useMemo, useRef } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { panelLayout, FOCUS_WINDOW } from "@/lib/galleryLayout";


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

let sharedBackdropTexture: THREE.CanvasTexture | null = null;
let sharedRaysTexture: THREE.CanvasTexture | null = null;
function getBackdropTexture() {
  if (!sharedBackdropTexture) sharedBackdropTexture = makeBackdropTexture();
  return sharedBackdropTexture;
}
function getRaysTexture() {
  if (!sharedRaysTexture) sharedRaysTexture = makeRaysTexture();
  return sharedRaysTexture;
}

export default function PanelGlow({ index, phase = 0 }: { index: number; phase?: number }) {
  const layoutX = useMemo(() => panelLayout(index).position.x, [index]);
  const groupRef = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const raysMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const rays = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  const hoverEase = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    t.current += delta;
    const breathe = 0.5 + Math.sin(t.current * 1.4 + phase) * 0.3;

    const dist = Math.abs(layoutX - galleryState.focusX);
    const focus = THREE.MathUtils.clamp(1 - dist / FOCUS_WINDOW, 0, 1);
    const focusSmooth = focus * focus * (3 - 2 * focus);
    const hoverTarget = galleryState.hoveredIndex === index ? 1 : 0;
    hoverEase.current += (hoverTarget - hoverEase.current) * Math.min(1, delta * 6);
    const boost = Math.max(focusSmooth, hoverEase.current);

    if (groupRef.current) groupRef.current.position.z = hoverEase.current * 0.24;

    if (material.current) {
      material.current.opacity = 0.16 + breathe * 0.32 + boost * 0.18;
    }
    if (mesh.current) {
      const scale = 1 + breathe * 0.12 + boost * 0.1;
      mesh.current.scale.setScalar(scale);
    }
    if (raysMaterial.current) {
      raysMaterial.current.opacity = 0.12 + breathe * 0.18 + boost * 0.14;
    }
    if (rays.current) {
      rays.current.rotation.z = t.current * 0.045;
      const scale = 1 + breathe * 0.06 + boost * 0.08;
      rays.current.scale.setScalar(scale);
    }
    if (light.current) {
      light.current.intensity = 0.35 + breathe * 0.45 + boost * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[layoutX, 0, 0]}>
      <Billboard position={[0, 0, -0.55]}>
        <mesh ref={rays}>
          <planeGeometry args={[5.2, 5.2]} />
          <meshBasicMaterial
            ref={raysMaterial}
            map={getRaysTexture()}
            transparent
            depthWrite={false}
            toneMapped={false}
            fog={false}
            blending={THREE.AdditiveBlending}
            opacity={0.2}
          />
        </mesh>
      </Billboard>
      <Billboard position={[0, 0, -0.42]}>
        <mesh ref={mesh}>
          <planeGeometry args={[3.6, 3.6]} />
          <meshBasicMaterial
            ref={material}
            map={getBackdropTexture()}
            transparent
            depthWrite={false}
            toneMapped={false}
            fog={false}
            blending={THREE.AdditiveBlending}
            opacity={0.32}
          />
        </mesh>
      </Billboard>
      <pointLight ref={light} color="#8a5cff" position={[0, 0, -0.3]} intensity={0.35} distance={3.2} decay={2} />
    </group>
  );
}
