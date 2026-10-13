"use client";

import { useEffect, useState, type RefObject } from "react";

// True while the element is within `rootMargin` of the viewport. Used to stop
// the WebGL scenes (and other per-frame loops) from rendering while they're
// off-screen; the margin lets a scene wake up just before it scrolls in.
export function useInView(ref: RefObject<Element | null>, rootMargin = "25% 0px") {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
