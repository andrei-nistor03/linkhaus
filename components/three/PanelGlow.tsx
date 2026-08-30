"use client";

import { useRef } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { panelLayout, FOCUS_WINDOW } from "@/lib/galleryLayout";

/**
 * A direct replica of the hero's pulsing violet backdrop
 * (components/three/PulsatingLight.tsx — same radial-gradient-on-an-
 * additive-billboard glow plane, same sunburst-rays plane, same idle
 * "breathe" pulse, same point light), duplicated here rather than shared so
 * PulsatingLight.tsx and the hero it lights stay untouched. One instance is
 * parked behind every ProjectPanel instead of the one behind the hero's 3D
 * mark. In place of the hero's `scrollState.heroProgress` boost (the glow
 * brightening as the camera dollies toward the object), this version reads
 * how in-focus or hovered *this* panel currently is — the same "closer to
 * you, brighter" idea, driven by the gallery's own state instead.
 */

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

// Every panel's glow is visually identical (same gradient, same rays) —
// generated once on first use and shared by every PanelGlow instance
// instead of six separate components each drawing their own copy of the
// same 512px canvas.
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
  const layoutX = panelLayout(index).position.x;
  const groupRef = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const raysMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const rays = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  // Eased separately from `boost` below (which also folds in focus, for
  // brightness) — this one exists purely to mirror ProjectPanel's own
  // `hover.current * 0.24` forward pop on identical terms, so the glow
  // rides forward with its panel on hover instead of being left behind at
  // a fixed depth while the card in front of it pops toward the camera.
  const hoverEase = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    t.current += delta;
    const breathe = 0.5 + Math.sin(t.current * 1.4 + phase) * 0.3; // 0.2 .. 0.8

    // Same role as the hero's scrollState.heroProgress boost — "brighter
    // the closer it is to being the one you're looking at" — just driven
    // by this panel's own focus/hover instead of a scroll-through-a-door.
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

  // z offsets pulled way in from the hero's original -1.7/-1.8/-1.85 (tuned
  // for a camera that stood back and stayed put) — this gallery's camera
  // pans with the cursor and pops each panel forward on hover, and at the
  // original distance the glow sat far enough behind that it visibly
  // parallaxed at a different rate than its panel, reading as if the two
  // weren't actually attached. Sitting just behind the card instead keeps
  // both close enough to the same depth that they move together.
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
