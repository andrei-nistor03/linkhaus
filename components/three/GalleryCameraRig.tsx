"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import { galleryState } from "@/lib/galleryState";
import { PANEL_WIDTH } from "@/lib/galleryLayout";

const BASE_Z = 4.6;
const BASE_Y = 0.18;
const BASE_FOV = 32;

const FIT_PANEL_WIDTH = PANEL_WIDTH * 1.18;
const HALF_FOV_RAD = THREE.MathUtils.degToRad(BASE_FOV / 2);

export default function GalleryCameraRig({
  reducedMotion,
  vertical,
}: {
  reducedMotion: boolean;
  // On the mobile vertical stack the camera ignores the pointer entirely: a
  // tap would otherwise shove the whole scene away from the finger, which
  // reads as the content jumping rather than as parallax.
  vertical: boolean;
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const lookTarget = useRef(new THREE.Vector3());
  const t = useRef(0);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    t.current += delta;
    const velocity = THREE.MathUtils.clamp(galleryState.velocity, -1, 1);
    const still = reducedMotion || vertical;
    const p = scrollState.pointerEased;

    const aspect = state.size.width / state.size.height;
    const fitZ = FIT_PANEL_WIDTH / (2 * Math.tan(HALF_FOV_RAD) * aspect);
    const baseZ = Math.max(BASE_Z, fitZ);

    const swayY = reducedMotion ? 0 : Math.sin(t.current * 0.22) * 0.05;
    const swayZ = reducedMotion ? 0 : Math.sin(t.current * 0.17) * 0.09;
    const velocityPunch = reducedMotion ? 0 : -Math.abs(velocity) * 0.22;

    const targetX = still ? 0 : p.x * 0.3;
    const targetY = BASE_Y + swayY + (still ? 0 : -p.y * 0.12);
    const targetZ = baseZ + swayZ + velocityPunch;

    const ease = Math.min(1, delta * 2.6);
    camera.position.x += (targetX - camera.position.x) * ease;
    camera.position.y += (targetY - camera.position.y) * ease;
    camera.position.z += (targetZ - camera.position.z) * ease;

    lookTarget.current.set(still ? 0 : p.x * 0.4, targetY * 0.3, 0);
    camera.up.set(0, 1, 0);
    camera.lookAt(lookTarget.current);

    const targetRoll = reducedMotion ? 0 : -velocity * 0.03;
    camera.rotation.z +=
      (targetRoll - camera.rotation.z) * Math.min(1, delta * 4);

    const targetFov = reducedMotion
      ? BASE_FOV
      : BASE_FOV + Math.abs(velocity) * 3.2;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
