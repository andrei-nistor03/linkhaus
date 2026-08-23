"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

interface RepelTextProps {
  children: string;
  className?: string;
  /** px radius of pointer influence around each character */
  radius?: number;
  /** max px a character is pushed away when the pointer sits on top of it */
  strength?: number;
}

interface Char {
  el: HTMLSpanElement;
  cx: number;
  cy: number;
  setX: (v: number) => void;
  setY: (v: number) => void;
}

/**
 * Splits `children` into one <span> per character (each word kept
 * non-breaking so lines still wrap at word boundaries) and pushes nearby
 * characters away from the pointer, like a small field of magnets — the
 * "repellant to the mouse" half of the hero copy. Paired with the
 * `.hero-text-3d` layered text-shadow in globals.css for the "3D" half.
 *
 * This stays plain DOM on purpose rather than real WebGL text: the hero's
 * scroll-tied blur/dissolve (see Hero.tsx) is a native CSS `filter` on an
 * ancestor, which keeps working for free here. Actual 3D geometry inside
 * the Canvas would need a converted font file and its own blur strategy
 * (canvas filters don't compose with the DOM the same way).
 *
 * Character rest positions are measured once on mount/resize, not every
 * frame — the pointermove handler is then just cached-center arithmetic
 * plus a `gsap.quickTo` set, no layout reads in the hot path.
 */
export default function RepelText({ children, className, radius = 90, strength = 16 }: RepelTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const charsRef = useRef<Char[]>([]);
  const isTouch = useIsTouch();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const spans = Array.from(root.querySelectorAll<HTMLSpanElement>("[data-char]"));
    charsRef.current = spans.map((el) => ({
      el,
      cx: 0,
      cy: 0,
      setX: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }),
      setY: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }),
    }));

    function measure() {
      for (const c of charsRef.current) {
        const rect = c.el.getBoundingClientRect();
        c.cx = rect.left + rect.width / 2;
        c.cy = rect.top + rect.height / 2;
      }
    }
    measure();

    if (isTouch || reducedMotion) return;

    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("scroll", measure, { passive: true });

    function onMove(e: PointerEvent) {
      for (const c of charsRef.current) {
        const dx = c.cx - e.clientX;
        const dy = c.cy - e.clientY;
        const dist = Math.hypot(dx, dy);
        if (dist >= radius || dist === 0) {
          c.setX(0);
          c.setY(0);
          continue;
        }
        const push = (1 - dist / radius) * strength;
        c.setX((dx / dist) * push);
        c.setY((dy / dist) * push);
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("pointermove", onMove);
    };
  }, [children, isTouch, reducedMotion, radius, strength]);

  const words = children.split(" ");

  return (
    <span ref={rootRef} className={className} aria-label={children}>
      {words.map((word, wi) => (
        <span key={wi}>
          <span className="inline-block whitespace-nowrap">
            {word.split("").map((char, ci) => (
              <span key={ci} data-char className="hero-text-3d inline-block will-change-transform">
                {char}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
