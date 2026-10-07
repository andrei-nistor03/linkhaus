"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { trackOffset, type GalleryMetrics } from "@/lib/galleryLayout";

export default function GalleryTrack({
  metrics,
  children,
}: {
  metrics: GalleryMetrics;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const initialized = useRef(false);

  // Switching between the horizontal rail and the mobile vertical stack
  // moves the track onto a different axis, so drop the old offset instead
  // of easing across it.
  useEffect(() => {
    initialized.current = false;
    groupRef.current?.position.set(0, 0, 0);
  }, [metrics]);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const axis = metrics.vertical ? "y" : "x";
    const target = trackOffset(galleryState.progress, metrics);

    if (!initialized.current) {
      group.position[axis] = target;
      initialized.current = true;
    } else {
      const ease = 1 - Math.pow(0.0025, delta);
      group.position[axis] += (target - group.position[axis]) * ease;
    }

    galleryState.focus = -group.position[axis];
  });

  return <group ref={groupRef}>{children}</group>;
}
