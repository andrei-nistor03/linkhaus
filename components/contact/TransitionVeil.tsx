"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, registerGsap } from "@/lib/gsap";

interface TransitionVeilProps {
  sectionRef: RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}

const TRIGGER_START = "top 90%";
const TRIGGER_END = "top 1%";

export default function TransitionVeil({
  sectionRef,
  reducedMotion,
}: TransitionVeilProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    const root = rootRef.current;
    if (!section || !root) return;

    if (reducedMotion) {
      gsap.set(root, { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(root, { opacity: 1 });
      gsap.set(washRef.current, { opacity: 0 });
      gsap.set(textRef.current, {
        opacity: 0,
        scale: 1.16,
        filter: "blur(18px)",
      });

      const blur = { px: 0 };
      const applyBlur = () => {
        root.style.backdropFilter = `blur(${blur.px}px)`;
        root.style.setProperty("-webkit-backdrop-filter", `blur(${blur.px}px)`);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: TRIGGER_START,
          end: TRIGGER_END,
          scrub: 0.4,
        },
      });

      tl.to(
        washRef.current,
        { opacity: 0.92, duration: 0.4, ease: "power2.out" },
        0,
      )
        .to(
          blur,
          { px: 28, duration: 0.4, ease: "power2.out", onUpdate: applyBlur },
          0,
        )
        .to(
          textRef.current,
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.4,
            ease: "power2.out",
          },
          0,
        )
        .to(
          washRef.current,
          { opacity: 0, duration: 0.5, ease: "power1.in" },
          0.55,
        )
        .to(
          blur,
          { px: 0, duration: 0.5, ease: "power1.in", onUpdate: applyBlur },
          0.55,
        )
        .to(
          textRef.current,
          {
            opacity: 0,
            scale: 0.94,
            filter: "blur(14px)",
            duration: 0.45,
            ease: "power1.in",
          },
          0.55,
        );
    }, rootRef);

    return () => {
      ctx.revert();
      root.style.backdropFilter = "";
      root.style.removeProperty("-webkit-backdrop-filter");
    };
  }, [sectionRef, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      <div ref={washRef} className="absolute inset-0 bg-ink" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <span
          ref={textRef}
          className="font-display font-black uppercase leading-none tracking-wide text-paper [font-variation-settings:'wght'_900,'CNTR'_0] text-[clamp(2.5rem,9vw,7rem)]"
          style={{ willChange: "transform, opacity, filter" }}
        >
          CONTACT
        </span>
      </div>
    </div>
  );
}
