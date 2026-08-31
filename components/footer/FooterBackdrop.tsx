"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useMediaQuery";

const MOTE_COUNT = 10;

function hash(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function FooterBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const motesRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const motes = useMemo(
    () =>
      Array.from({ length: MOTE_COUNT }, (_, i) => ({
        left: Number((6 + hash(i) * 88).toFixed(3)),
        top: Number((6 + hash(i + 40) * 78).toFixed(3)),
        size: Number((3 + hash(i + 80) * 5).toFixed(3)),
        duration: Number((7 + hash(i + 120) * 6).toFixed(3)),
        delay: Number((-(hash(i + 160) * 12)).toFixed(3)),
      })),
    [],
  );

  useEffect(() => {
    registerGsap();
    const root = rootRef.current;
    const motesEl = motesRef.current;
    if (!root || !motesEl) return;

    if (reducedMotion) {
      gsap.set(motesEl, { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(motesEl, { opacity: 0.85 });

      gsap.to(motesEl, {
        opacity: 0.3,
        scale: 0.85,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom bottom", scrub: 0.6 },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div ref={motesRef} className="absolute inset-0">
        {motes.map((m, i) => (
          <span
            key={i}
            className="footer-mote absolute rounded-full bg-paper"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              filter: "blur(1px)",
              animationDuration: `${m.duration}s`,
              animationDelay: `${m.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
