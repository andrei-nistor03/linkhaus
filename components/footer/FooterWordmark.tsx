"use client";

import { useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

const WORD = "LINKHAUS";

/**
 * The footer's own, larger wordmark lockup — links back to #top (the same
 * jump target as Nav.tsx's own logo), so it doubles as a second, more
 * prominent "back to top" affordance alongside the explicit one at the very
 * bottom of the page. On desktop, hovering nudges each letter up in a tight
 * stagger and lets it settle back — restrained (a few px, no rotation or
 * color change), not the continuous idle wave Projects/Services use for
 * their section labels: this only plays on intent (hover), matching the
 * footer's calmer "energy has passed" register.
 */
export default function FooterWordmark() {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const isTouch = useIsTouch();
  const reducedMotion = useReducedMotion();
  const letters = useMemo(() => WORD.split(""), []);

  const handleEnter = () => {
    if (isTouch || reducedMotion) return;
    gsap.to(letterRefs.current, {
      y: -10,
      duration: 0.45,
      ease: "art",
      stagger: 0.025,
      overwrite: "auto",
    });
  };

  const handleLeave = () => {
    if (isTouch || reducedMotion) return;
    gsap.to(letterRefs.current, {
      y: 0,
      duration: 0.5,
      ease: "art",
      stagger: 0.02,
      overwrite: "auto",
    });
  };

  return (
    <a
      href="#top"
      data-cursor="link"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="inline-flex font-display font-black uppercase leading-[0.85] text-paper [font-variation-settings:'wght'_900,'CNTR'_0] text-[clamp(2.25rem,5.6vw,4.75rem)]"
    >
      {letters.map((char, i) => (
        <span
          key={char + i}
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          className="inline-block will-change-transform"
        >
          {char}
        </span>
      ))}
      <span className="text-accent-blue">.</span>
    </a>
  );
}
