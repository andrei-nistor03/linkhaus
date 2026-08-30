"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useIsTouch } from "@/lib/useMediaQuery";
import { subscribeCursorOverride } from "@/lib/cursorState";

type Variant = "default" | "link" | "project" | "3d";

const RING_SIZE: Record<Variant, number> = {
  default: 42,
  link: 68,
  project: 128,
  "3d": 140,
};

/**
 * Desktop-only custom cursor with a fast dot and a lagging ring. Interactive
 * elements opt in via `data-cursor="link" | "project" | "3d"` so the cursor
 * communicates intent (view a project, drag a 3D scene) instead of being
 * purely decorative.
 *
 * The whole cursor is rendered in white and blended onto the page with
 * `mix-blend-mode: difference`, so it always inverts whatever is beneath
 * it — a thin ink-colored ring reads fine on plain paper but gets lost
 * over the halftone texture or a dark section; differencing stays visible
 * everywhere without per-section color logic.
 */
export default function CustomCursor() {
  const isTouch = useIsTouch();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [domVariant, setDomVariant] = useState<Variant>("default");
  // Wins over `domVariant` whenever a 3D scene (no real DOM hover target to
  // attach `data-cursor` to) pushes one via lib/cursorState.ts — see
  // ProjectPanel.tsx.
  const [override, setOverride] = useState<Variant | null>(null);
  const variant = override ?? domVariant;

  useEffect(() => subscribeCursorOverride(setOverride), []);

  useEffect(() => {
    if (isTouch) return;
    document.documentElement.classList.add("has-custom-cursor");

    const dot = dotRef.current!;
    const ring = ringRef.current!;

    const setDotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const setDotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
    const setRingX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const setRingY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 2;
    let velocity = 0;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - lastX;
      velocity = gsap.utils.clamp(-1, 1, dx / 40);
      lastX = e.clientX;
      lastY = e.clientY;
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
      gsap.to(ring, {
        rotate: velocity * 18,
        duration: 0.3,
        overwrite: "auto",
      });
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor]");
      const v = target?.getAttribute("data-cursor") as Variant | null;
      setDomVariant(v ?? "default");
    };
    const onOut = (e: MouseEvent) => {
      const related = (e.relatedTarget as HTMLElement)?.closest?.("[data-cursor]");
      if (!related) setDomVariant("default");
    };
    const onDown = () => gsap.to(dot, { scale: 0.6, duration: 0.15 });
    const onUp = () => gsap.to(dot, { scale: 1, duration: 0.25 });

    window.addEventListener("pointermove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isTouch]);

  if (isTouch) return null;

  const size = RING_SIZE[variant];

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference" aria-hidden="true">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          width: 9,
          height: 9,
          opacity: variant === "default" ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white text-center transition-[width,height,background-color] duration-300 ease-art"
        style={{
          width: size,
          height: size,
          backgroundColor: variant === "project" || variant === "3d" ? "#ffffff" : "transparent",
        }}
      >
        {variant === "project" && (
          <span className="font-mono-label text-[10px] leading-tight text-black">
            VIEW
            <br />
            PROJECT
          </span>
        )}
        {variant === "3d" && (
          <span className="font-mono-label text-[10px] leading-tight text-black">
            DRAG
            <br />
            EXPLORE
          </span>
        )}
      </div>
    </div>
  );
}
