"use client";

export type NavTransitionHandler = (target: string) => void;

// Module-level store, not context: there's exactly one producer
// (SectionTransitionOverlay, mounted once in app/page.tsx) and several
// consumers scattered far apart in the tree (Nav.tsx, Footer.tsx) — same
// shape as lenisState.ts/contactState.ts.
let handler: NavTransitionHandler | null = null;

/** Registered by SectionTransitionOverlay on mount. */
export function setNavTransitionHandler(fn: NavTransitionHandler | null) {
  handler = fn;
}

/**
 * Requests the loader-and-teleport transition to `target` (a "#hash"
 * section id) in place of a smooth scroll. No-ops before the overlay has
 * mounted or while a transition is already in flight — the overlay itself
 * guards re-entrancy, see its own comment.
 */
export function requestSectionTransition(target: string) {
  handler?.(target);
}
