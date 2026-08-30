"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { galleryState } from "@/lib/galleryState";

// Chosen so a fully-focused, dead-center panel reads as large but not
// full-bleed (~60-65% of the viewport) — close enough for the "hero
// project" treatment the brief asks for, far enough that the corridor
// (floor grid, particles, neighboring panels) stays visible around it, so
// this still reads as a space the scene is travelling through rather than
// a fullscreen slideshow.
const BASE_Z = 4.6;
const BASE_Y = 0.18;
const BASE_FOV = 32;

/**
 * The camera does *not* dolly through the gallery — GalleryTrack slides the
 * panels past it instead (see that file's comment for why: a moving camera
 * whose own orientation drifted with scroll progress meant different panels
 * arrived at center under different camera angles and read as
 * inconsistently tilted). This rig only ever nudges the camera around a
 * fixed resting pose: a light ambient sway keyed off elapsed time (not
 * scroll progress, so it doesn't correlate with which panel happens to be
 * centered), cursor parallax (reusing scrollState.pointerEased, kept alive
 * globally by the hero's PointerTracker, for the same camera language as
 * CameraRig.tsx), and a transient roll/FOV/push kicked by scroll velocity —
 * momentary, tied to how fast the user is scrolling right now rather than
 * to a fixed position in the sequence.
 */
export default function GalleryCameraRig({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const lookTarget = useRef(new THREE.Vector3());
  const t = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    t.current += delta;
    const velocity = THREE.MathUtils.clamp(galleryState.velocity, -1, 1);
    const p = scrollState.pointerEased;

    const sway = reducedMotion
      ? { y: 0, z: 0 }
      : { y: Math.sin(t.current * 0.22) * 0.05, z: Math.sin(t.current * 0.17) * 0.09 };
    const velocityPunch = reducedMotion ? 0 : -Math.abs(velocity) * 0.22;

    const targetX = reducedMotion ? 0 : p.x * 0.3;
    const targetY = BASE_Y + sway.y + (reducedMotion ? 0 : -p.y * 0.12);
    const targetZ = BASE_Z + sway.z + velocityPunch;

    const ease = Math.min(1, delta * 2.6);
    camera.position.x += (targetX - camera.position.x) * ease;
    camera.position.y += (targetY - camera.position.y) * ease;
    camera.position.z += (targetZ - camera.position.z) * ease;

    lookTarget.current.set(reducedMotion ? 0 : p.x * 0.4, targetY * 0.3, 0);
    camera.up.set(0, 1, 0);
    camera.lookAt(lookTarget.current);

    // A hint of roll under fast scrolling — physical momentum, not a
    // sci-cinema Dutch angle; capped low, and purely velocity-driven so it
    // never lands the same way twice at the same panel.
    const targetRoll = reducedMotion ? 0 : -velocity * 0.03;
    camera.rotation.z += (targetRoll - camera.rotation.z) * Math.min(1, delta * 4);

    const targetFov = reducedMotion ? BASE_FOV : BASE_FOV + Math.abs(velocity) * 3.2;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
