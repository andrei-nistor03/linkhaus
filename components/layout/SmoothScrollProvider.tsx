"use client";

import { useEffect } from "react";
import { useLenis } from "@/lib/useLenis";
import { scrollState } from "@/lib/scrollState";

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useLenis();

  useEffect(() => {
    scrollState.isTouch = matchMedia("(pointer: coarse)").matches;
    scrollState.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  return <>{children}</>;
}
