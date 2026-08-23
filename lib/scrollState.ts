"use client";

/**
 * Lightweight mutable store for scroll/pointer data consumed inside the R3F
 * render loop. We intentionally avoid React state here: useFrame runs every
 * tick and re-rendering React for that would be wasteful. GSAP/ScrollTrigger
 * write into this object; three.js components read it in useFrame.
 */
export const scrollState = {
  /** 0 -> 1 progress through the pinned hero scroll sequence */
  heroProgress: 0,
  /** normalized scroll velocity, roughly -1 .. 1 */
  velocity: 0,
  /** pointer position in normalized device coords, -1 .. 1 */
  pointer: { x: 0, y: 0 },
  /** eased pointer, lags behind raw pointer for smoother reactions */
  pointerEased: { x: 0, y: 0 },
  /** whether the device is treated as touch/coarse pointer */
  isTouch: false,
  /** whether the user prefers reduced motion */
  reducedMotion: false,
};

export type ScrollState = typeof scrollState;
