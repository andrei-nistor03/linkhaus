"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

export const INTRO_COMPLETE_EVENT = "linkhaus:intro-complete";

/**
 * Cinematic ~1.4s entrance: a technical counter ticks up while the wordmark
 * clips into view, then the whole overlay lifts away. Dispatches
 * INTRO_COMPLETE_EVENT so the hero/nav can start their own reveal timelines
 * in lockstep, instead of everything animating in at once on mount.
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.style.overflow = "hidden";

    const counter = { val: 0 };
    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        document.documentElement.style.overflow = "";
        window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT));
        setDone(true);
      },
    });

    if (reduced) {
      tl.to({}, { duration: 0.05 });
    } else {
      tl.to(counter, {
        val: 100,
        duration: 1.1,
        onUpdate: () => {
          if (countRef.current) {
            countRef.current.textContent = String(Math.round(counter.val)).padStart(3, "0");
          }
        },
      })
        .to(".preloader-word .char", { yPercent: 0, stagger: 0.02, duration: 0.5 }, 0.15)
        .to(rootRef.current, { yPercent: -100, duration: 0.7, ease: "expo.inOut" }, "+=0.05");
    }

    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (done) return null;

  const word = "LINKHAUS".split("");

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-paper"
      aria-hidden="true"
    >
      <div className="preloader-word flex overflow-hidden text-4xl font-medium tracking-tightest sm:text-6xl">
        {word.map((c, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <span className="char inline-block translate-y-full" style={{ transitionDelay: `${i * 20}ms` }}>
              {c}
            </span>
          </span>
        ))}
      </div>
      <div className="font-mono-label mt-6 flex items-center gap-3 text-xs text-muted">
        <span>LOADING</span>
        <span className="tabular-nums text-ink">
          <span ref={countRef}>000</span>/100
        </span>
      </div>
    </div>
  );
}
