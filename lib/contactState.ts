"use client";

/**
 * Mutable store for the Contact section's scroll/pointer/hover data, read
 * inside the R3F render loop (ContactField, ContactParticles). Same
 * rationale as scrollState.ts: useFrame ticks up to 60x/sec and re-rendering
 * React for that would be wasted work, so GSAP/ScrollTrigger and plain DOM
 * listeners write into this plain object instead of React state.
 */
export const contactState = {
  /** 0 -> 1 scroll progress through the Contact section (section top hits
   *  viewport bottom -> section bottom hits viewport top). Drives the
   *  backdrop's overall intensity crescendo. */
  progress: 0,
  /** pointer position in normalized device coords, -1..1, relative to the
   *  Contact section's own canvas. */
  pointer: { x: 0, y: 0 },
  /** eased pointer, lags behind raw pointer for smoother reactions. */
  pointerEased: { x: 0, y: 0 },
  /** 0 -> 1, bumped while the cursor is over the email/phone CTAs so the
   *  backdrop can visibly react to them being hovered (eased in useFrame,
   *  not snapped, so the response reads as the atmosphere "noticing" the
   *  cursor rather than a hard toggle). */
  hoverBoost: 0,
  /** target hoverBoost gets eased toward each frame. */
  hoverBoostTarget: 0,
  isTouch: false,
  reducedMotion: false,
};

export type ContactState = typeof contactState;
