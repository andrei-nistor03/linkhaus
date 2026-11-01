"use client";

import { useEffect, useState, type RefObject } from "react";
import { INTRO_COMPLETE_EVENT } from "@/components/preloader/Preloader";

// Latches true once the element comes within `rootMargin` of the viewport, or
// once the browser goes idle after the intro, whichever happens first. Used to
// keep the below-the-fold WebGL scenes (and their textures) out of the initial
// load without making them pop in late: by the time a visitor scrolls there,
// they're normally already built. `preload` warms the scene's code chunk early
// so a near-viewport mount doesn't also wait on the network.
export function useDeferredMount(
  ref: RefObject<Element | null>,
  { rootMargin = "100% 0px", preload }: { rootMargin?: string; preload?: () => unknown } = {},
) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;

    const mount = () => setMounted(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) mount();
      },
      { rootMargin },
    );
    observer.observe(el);

    // Safari has no requestIdleCallback; a short timeout stands in for it.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = (cb: () => void) =>
      hasIdle ? window.requestIdleCallback(cb, { timeout: 2500 }) : window.setTimeout(cb, 400);
    const cancelIdle = (id: number) =>
      hasIdle ? window.cancelIdleCallback(id) : window.clearTimeout(id);

    let idleId = 0;
    const onIntro = () => {
      preload?.();
      idleId = idle(mount);
    };
    window.addEventListener(INTRO_COMPLETE_EVENT, onIntro, { once: true });

    return () => {
      observer.disconnect();
      window.removeEventListener(INTRO_COMPLETE_EVENT, onIntro);
      if (idleId) cancelIdle(idleId);
    };
  }, [ref, rootMargin, preload, mounted]);

  return mounted;
}
