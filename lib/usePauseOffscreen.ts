"use client";

import { useEffect, type RefObject } from "react";

// Marks the element `data-offscreen` while it's out of view; a rule in
// globals.css pauses every CSS animation inside it, so endless loops (wave
// labels, gradients, motes) don't keep ticking for sections nobody can see.
export function usePauseOffscreen(ref: RefObject<HTMLElement | null>, rootMargin = "10% 0px") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => el.toggleAttribute("data-offscreen", !entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.removeAttribute("data-offscreen");
    };
  }, [ref, rootMargin]);
}
