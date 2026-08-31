"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { contactState } from "@/lib/contactState";

/**
 * Writes raw pointer position into contactState (NDC, -1..1) and eases both
 * it and hoverBoost toward their targets every frame — same split as
 * HeroScene's PointerTracker, kept as its own component so ContactField and
 * ContactParticles can both read the smoothed values without duplicating the
 * lerp. Safe to run unconditionally: Contact.tsx's background wrapper is
 * `sticky`, so it's always exactly viewport-sized while any of this canvas
 * is visible, which is what makes a window-relative NDC reading line up with
 * the canvas's own coordinate space.
 */
export default function ContactPointer() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      contactState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      contactState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const ease = Math.min(1, delta * 3.2);
    contactState.pointerEased.x += (contactState.pointer.x - contactState.pointerEased.x) * ease;
    contactState.pointerEased.y += (contactState.pointer.y - contactState.pointerEased.y) * ease;
    const hoverEase = Math.min(1, delta * 4);
    contactState.hoverBoost += (contactState.hoverBoostTarget - contactState.hoverBoost) * hoverEase;
  });

  return null;
}
