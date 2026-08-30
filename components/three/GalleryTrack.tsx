"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { trackOffsetX } from "@/lib/galleryLayout";

/**
 * The one thing in this scene that actually moves with scroll. Wraps every
 * panel plus GalleryEnvironment and translates the whole group along x each
 * frame from galleryState.progress — the camera (GalleryCameraRig) stays
 * essentially planted, so every panel is carried past the same fixed
 * vantage point instead of a moving camera visiting each one on its own
 * path (which is what let different panels arrive at center under
 * different camera orientations and read as inconsistently "slanted").
 *
 * Publishes galleryState.focusX as the inverse of its own offset — the
 * local x that is currently centered in front of the camera — so
 * ProjectPanel's focus falloff (`|layout.position.x - focusX|`) keeps
 * working unchanged regardless of which side of the camera/scene relationship
 * is doing the moving.
 */
export default function GalleryTrack({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const initialized = useRef(false);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const targetX = trackOffsetX(galleryState.progress);

    if (!initialized.current) {
      group.position.x = targetX;
      initialized.current = true;
    } else {
      const ease = 1 - Math.pow(0.0025, delta);
      group.position.x += (targetX - group.position.x) * ease;
    }

    galleryState.focusX = -group.position.x;
  });

  return <group ref={groupRef}>{children}</group>;
}
