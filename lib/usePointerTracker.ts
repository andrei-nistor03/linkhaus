"use client";

import { useEffect } from "react";
import { gsap, registerGsap } from "./gsap";
import { scrollState } from "./scrollState";

// Tracks the pointer in normalized [-1, 1] coordinates and eases it on GSAP's
// ticker. It used to ease inside the hero canvas's frame loop, which stops
// once the hero scrolls away, so every later scene (the gallery's camera and
// flake repel) read a frozen pointer.
export function usePointerTracker() {
  useEffect(() => {
    registerGsap();

    const onMove = (e: PointerEvent) => {
      scrollState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = (_time: number, deltaMs: number) => {
      const ease = Math.min(1, (deltaMs / 1000) * 3.2);
      scrollState.pointerEased.x += (scrollState.pointer.x - scrollState.pointerEased.x) * ease;
      scrollState.pointerEased.y += (scrollState.pointer.y - scrollState.pointerEased.y) * ease;
    };
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
    };
  }, []);
}
