"use client";

import { useCallback, useSyncExternalStore } from "react";

// Reads the query synchronously on the client, so components that mount
// after hydration (the ssr:false WebGL scenes) get the right answer on their
// very first render instead of building the desktop version first and
// rebuilding a frame later. Server-rendered components still hydrate with
// `false` and update right after.
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useIsTouch() {
  return useMediaQuery("(pointer: coarse)");
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

// For one-off checks inside effects, where a hook value from the hydration
// render could still be the server default.
export function isTouchDevice() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}
