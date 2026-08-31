"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useMediaQuery";

const MOTE_COUNT = 10;

// Deterministic pseudo-random in [0, 1) from an integer seed — the classic
// sine-hash trick. Plain Math.random() would scatter the motes differently
// on the server render than on the client's hydration pass (this component
// isn't behind a `dynamic(..., { ssr: false })` boundary the way the R3F
// scenes are), which React flags as a hydration mismatch on every inline
// style that used it. This is a pure function of `i`, so server and client
// always agree.
function hash(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The footer's ambient backdrop — a handful of slow-drifting motes, echoing
 * ContactParticles' own drifting dots (see components/three/) without
 * literally continuing that WebGL scene: that canvas lives inside Contact's
 * own `sticky h-screen overflow-hidden` layer and never reaches this far
 * down the page, and standing up a second three.js scene just to fade it
 * out would be exactly the "another major 3D scene" the brief says to
 * avoid. An earlier version paired this with a violet glow that scrubbed
 * down as the footer scrolled in, echoing ContactFieldMaterial.ts's own
 * color — dropped because it read as its own atmosphere bleeding into the
 * footer rather than a clean handoff; the footer now starts on a flat,
 * settled bg-ink instead (see Footer.tsx's own top border for how that
 * handoff is marked instead).
 *
 * Absolutely positioned inside Footer's own `relative overflow-hidden`
 * root, the same containment pattern ServicesBackdrop.tsx uses.
 */
export default function FooterBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const motesRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Rounded to a fixed few decimals at creation, not left as raw floats:
  // the browser's own CSSOM re-serializes an inline style attribute with
  // far fewer significant digits than a raw `Math.sin()` result carries, so
  // the server-rendered HTML (still full precision) and what hydration
  // reads back off the already-parsed-and-normalized DOM disagree on the
  // *text* of an identical value — a spurious hydration mismatch, not an
  // actual difference in the numbers.
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

    // Reduced motion: motes dropped entirely, the same call ContactScene.tsx
    // makes for its own particles under reduced motion.
    if (reducedMotion) {
      gsap.set(motesEl, { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(motesEl, { opacity: 0.85 });

      // A quiet settle rather than a hard cutoff: motes fade/shrink back as
      // the footer scrolls in, scrubbed across the footer's own top-bottom
      // span. Same "start/end guaranteed reachable at the document's own
      // max scroll" reasoning Contact.tsx's crescendo trigger and this
      // component's sibling entrance timeline (see Footer.tsx) both rely
      // on — a shallower end point risks never being reached this close to
      // the bottom of the page.
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
