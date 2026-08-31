"use client";

import type Lenis from "lenis";

/**
 * Holds the single Lenis instance SmoothScrollProvider creates (see
 * useLenis.ts), so code outside that hook can drive a scroll through
 * Lenis's own eased `scrollTo` instead of a raw `window.scrollTo` — which
 * Lenis's hijacked wheel/scroll handling doesn't coordinate with, so a bare
 * native scroll call tends to fight or get overridden on the next tick.
 * Footer's "back to top" control is currently the only consumer.
 *
 * A plain mutable ref object (matching contactState.ts/scrollState.ts'
 * "no React state for something read outside React's render cycle"
 * convention) rather than context: there's exactly one instance and one
 * consumer, both far apart in the tree.
 */
export const lenisState: { instance: Lenis | null } = {
  instance: null,
};
