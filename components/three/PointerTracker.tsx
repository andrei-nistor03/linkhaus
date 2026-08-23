"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { scrollState } from "@/lib/scrollState";

/**
 * Writes raw pointer position into scrollState (as NDC, -1..1) and eases it
 * toward the target every frame. Kept separate from ParticleField/CameraRig
 * so both can read the same smoothed value without duplicating the lerp.
 */
export default function PointerTracker() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      scrollState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const ease = Math.min(1, delta * 3.2);
    scrollState.pointerEased.x += (scrollState.pointer.x - scrollState.pointerEased.x) * ease;
    scrollState.pointerEased.y += (scrollState.pointer.y - scrollState.pointerEased.y) * ease;
  });

  return null;
}
