"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";

const START_Z = 6;
const END_Z = 0.85;
const LOOK_AT = new THREE.Vector3(0, -0.03, 0);

// The vertical FOV dolly below (35deg -> 22deg) was tuned by eye against a
// wide (~16:10) canvas. Three's PerspectiveCamera.fov is a *vertical* FOV,
// so the horizontal FOV it implies shrinks as the canvas gets narrower —
// on a phone-portrait canvas (aspect ~0.5) that same vertical FOV frames a
// much narrower slice of the scene horizontally, which is what was cutting
// off the model's edges on mobile. Below REFERENCE_ASPECT we hold the
// *horizontal* FOV the tuned values imply constant and solve for the
// vertical FOV that reproduces it at the real aspect ratio, so the model's
// horizontal framing stays put regardless of how narrow the viewport gets.
// At/above REFERENCE_ASPECT this is a no-op — desktop framing is untouched.
const REFERENCE_ASPECT = 1.6;
const START_VFOV_DEG = 35;
const END_VFOV_DEG = 22;

function vFovForAspect(baseVFovDeg: number, baseAspect: number, aspect: number) {
  if (aspect >= baseAspect) return baseVFovDeg;
  const baseVFovRad = THREE.MathUtils.degToRad(baseVFovDeg);
  const hFovRad = 2 * Math.atan(Math.tan(baseVFovRad / 2) * baseAspect);
  const vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect);
  return THREE.MathUtils.radToDeg(vFovRad);
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Drives the hero camera purely off scrollState (written by ScrollTrigger)
 * plus the eased pointer, so the dolly-in and the parallax tilt live in one
 * place. The "through the opening into the light" read comes from pairing
 * this straight-line dolly toward a fixed look-at point with WallsModel's
 * own scroll-driven turn, which swings its doorway to meet that same point
 * — see DOOR_OFFSET in WallsModel.tsx.
 */
export default function CameraRig() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const aspect = size.width / size.height;
  const startFov = vFovForAspect(START_VFOV_DEG, REFERENCE_ASPECT, aspect);
  const endFov = vFovForAspect(END_VFOV_DEG, REFERENCE_ASPECT, aspect);

  useFrame((_, delta) => {
    const progress = easeInOutCubic(scrollState.heroProgress);
    const z = THREE.MathUtils.lerp(START_Z, END_Z, progress);
    const fov = THREE.MathUtils.lerp(startFov, endFov, progress);

    const p = scrollState.pointerEased;
    const parallaxX = p.x * 0.35 * (1 - progress * 0.6);
    const parallaxY = -p.y * 0.2 * (1 - progress * 0.6);

    camera.position.x += (parallaxX - camera.position.x) * Math.min(1, delta * 2.5);
    camera.position.y += (parallaxY - camera.position.y) * Math.min(1, delta * 2.5);
    camera.position.z = z;

    camera.lookAt(LOOK_AT);

    const persp = camera as THREE.PerspectiveCamera;
    if (persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
  });

  return null;
}
