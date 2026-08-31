"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { trackOffsetX } from "@/lib/galleryLayout";

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
