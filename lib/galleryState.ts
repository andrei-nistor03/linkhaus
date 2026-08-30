"use client";

/**
 * Mutable store for the Projects gallery, mirroring lib/scrollState.ts's
 * reasoning: GSAP/ScrollTrigger write into this from the DOM side, and
 * three.js components read it every useFrame tick. Plain React state would
 * mean a full React re-render per scroll pixel / per frame, which is exactly
 * what this pattern avoids.
 */
export const galleryState = {
  /** 0 -> 1 progress through the pinned gallery scroll sequence. */
  progress: 0,
  /** normalized scroll velocity, roughly -1 .. 1. */
  velocity: 0,
  /**
   * The track's *local*-space x that is currently centered in front of the
   * (fixed) camera — written once per frame by GalleryTrack as the inverse
   * of its own translation, read by every ProjectPanel to work out how "in
   * focus" (centered) it currently is by comparing against its own local
   * layout position, with no per-panel copy of that math needed.
   */
  focusX: 0,
  /** Index of the panel currently under the pointer, or -1. */
  hoveredIndex: -1,
};

export type GalleryState = typeof galleryState;
