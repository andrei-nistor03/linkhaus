"use client";

import { useMemo, useRef } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";

/**
 * Soft radial gradient, all the way from a light lavender core down through
 * the theme's accent violet (#8a5cff, tailwind.config.ts `accent.violet`)
 * into a deep purple — the same "canvas texture as glow" trick WallGlowBacking
 * uses for the panel backing, sized for a big soft backdrop instead of a
 * small panel. No blue in this ramp on purpose — it used to bottom out on
 * `accent.blue` (#2b4bff), which read as a blue glow rather than the
 * theme's purple.
 */
function makeBackdropTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;

  // Stops pulled in tighter than a plain 0→1 spread so the glow reads as a
  // smaller, more concentrated core with a short fade instead of a soft
  // haze filling the whole plane.
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

/**
 * A sunburst of tapered rays radiating from the center, drawn the same
 * "canvas texture, additive plane" way as the backdrop glow above. Rays vary
 * in width and length (via a cheap deterministic pseudo-random jitter keyed
 * off the ray index) so the burst doesn't read as a mechanical pinwheel.
 * Each ray widens as it goes outward from a point at the center — the usual
 * "sunburst" silhouette — and fades to transparent well before the texture
 * edge so there's no hard cutoff. Same purple-only ramp as the backdrop
 * texture above, no blue.
 */
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
    const halfWidthDeg = 5 + ((i * 37) % 11); // 5..15deg
    const halfWidth = (halfWidthDeg * Math.PI) / 180;
    const length = c * (0.68 + ((i * 53) % 30) / 100); // 0.68..0.97 of radius

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

/**
 * The pulsing purple glow that sits behind the 3D mark. This used to
 * be two bare pointLights parked back there — but with no geometry behind
 * the model to catch them, they had nothing to actually light, so the
 * "glow" was invisible. Worse, since they didn't cast shadows, their light
 * passed straight through the model's own geometry and washed out the
 * front faces the camera sees, fighting the "darker, one-sided" look.
 *
 * This is now an actual billboarded glow plane (an unlit, additive,
 * fog-disabled texture — same technique as WallGlowBacking) so it reads as
 * a soft halo behind the object regardless of camera angle, plus one small
 * low-intensity point light so the model's back rim still catches a hint
 * of color instead of a hard silhouette edge.
 *
 * The backdrop plane is sized well past the model's own footprint on
 * purpose — the model's key-light shadow camera alone spans roughly ±2.5
 * world units, so the glow plane's old 2.4-unit span sat entirely *behind*
 * the model's silhouette and never peeked out around its edges, which is
 * why it read as "not working." A second, larger billboarded plane behind
 * it carries the sunburst rays, rotating slowly for a bit of life.
 */
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
    const breathe = 0.5 + Math.sin(t.current * 1.4) * 0.3; // 0.2 .. 0.8
    const scrollBoost = scrollState.heroProgress;

    if (material.current) {
      // Capped well below 1 — at the original coefficients this touched
      // ~0.9 at peak breathe+scroll, which on an additive plane this size
      // read as a near-solid card rather than a glow. That was then
      // overcorrected too far down; ceiling now sits around ~0.6.
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

  // y positions: originally 0.05 (planes) / 0.1 (light), shifted down ~10%
  // of the frustum's visible height at this depth (camera z=6, fov 35,
  // plane at z≈-1.8 → ~4.9 units tall on screen here), then brought back up
  // ~5% of that same height — net ~5% below the original position.
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
