"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { scrollState } from "@/lib/scrollState";
import { useReducedMotion } from "@/lib/useMediaQuery";
import SceneErrorBoundary from "@/components/three/SceneErrorBoundary";
import HalftoneBackground from "@/components/hero/HalftoneBackground";
import { INTRO_COMPLETE_EVENT } from "@/components/layout/Preloader";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const HERO_WORDS: {
  text: string;
  size: string;
  position: string;
  pulseGap: number;
}[] = [
  {
    text: "Welcome",
    size: "text-[clamp(6rem,13vw,24rem)]",
    position: "left-[10%] top-24 text-left lg:left-[11%] lg:top-[15%]",
    pulseGap: 0,
  },
  {
    text: "to",
    size: "text-[clamp(5rem,10vw,20rem)]",
    position: "left-[62%] top-[23%] text-left lg:left-[62%] lg:top-[20%]",
    pulseGap: 1000,
  },
  {
    text: "the",
    size: "text-[clamp(7rem,14vw,24rem)]",
    position:
      "left-[10%] top-[30%] text-left lg:left-auto lg:right-[9%] lg:top-[19%]",
    pulseGap: 1000,
  },
  {
    text: "house",
    size: "text-[clamp(5rem,12vw,20rem)]",
    position: "left-[9%] top-[38%] text-left lg:left-[11%] lg:top-[47%]",
    pulseGap: 0,
  },
  {
    text: "of",
    size: "text-[clamp(8rem,15vw,24rem)]",
    position: "right-[10%] top-[42%] text-right lg:right-[25%] lg:top-[45%]",
    pulseGap: 1000,
  },
  {
    text: "online",
    size: "text-[clamp(4rem,10vw,18rem)]",
    position: "left-[8%] top-[76%] text-left lg:left-[13%] lg:top-[72%]",
    pulseGap: 0,
  },
  {
    text: "presence",
    size: "text-[clamp(5rem,10vw,16rem)]",
    position:
      "left-[8%] top-[86%] text-left lg:left-auto lg:right-[12%] lg:top-[74%]",
    pulseGap: 0,
  },
];

const LETTER_OFFSETS: { x: number; y: number }[] = [
  { x: -40, y: -32 },
  { x: 40, y: -28 },
  { x: 0, y: -46 },
  { x: -46, y: 30 },
  { x: 46, y: 26 },
  { x: 0, y: 44 },
  { x: -32, y: 0 },
  { x: 32, y: 0 },
];

function letterStretch(offset: { x: number; y: number }) {
  return Math.abs(offset.x) >= Math.abs(offset.y)
    ? { scaleX: 1.7, scaleY: 0.6 }
    : { scaleX: 0.6, scaleY: 1.7 };
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function Hero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const bgDissolveRef = useRef<HTMLDivElement>(null);

  const titleDissolveRef = useRef<HTMLDivElement>(null);
  const titleCharsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const reducedMotion = useReducedMotion();

  const wordCharStarts = useMemo(() => {
    let i = 0;
    return HERO_WORDS.map((w) => {
      const start = i;
      i += w.text.length;
      return start;
    });
  }, []);

  useEffect(() => {
    registerGsap();

    const idleTimers: ReturnType<typeof setTimeout>[] = [];
    const lastPulseIndex: (number | null)[] = [];

    const scheduleIdlePulse = (wi: number, delay: number) => {
      idleTimers[wi] = setTimeout(() => pulseWord(wi), delay);
    };

    const pulseWord = (wi: number) => {
      const start = wordCharStarts[wi];
      const len = HERO_WORDS[wi].text.length;
      const gap = HERO_WORDS[wi].pulseGap;
      const rawChars = titleCharsRef.current.slice(start, start + len);
      const chars = rawChars.filter((el): el is HTMLSpanElement => el != null);

      if (chars.length !== len) {
        scheduleIdlePulse(wi, gap);
        return;
      }

      const n = chars.length;
      const candidates = [...Array(n).keys()].filter(
        (k) => n === 1 || k !== lastPulseIndex[wi],
      );
      const i = candidates[Math.floor(Math.random() * candidates.length)];
      lastPulseIndex[wi] = i;
      const widths = chars.map((el) => el.offsetWidth);

      const scale = new Array(n).fill(1);
      scale[i] = randRange(1.55, 1.85);

      const neighborIdx = [i - 1, i + 1].filter((k) => k >= 0 && k < n);
      const extra = widths[i] * (scale[i] - 1);
      const perNeighbor = neighborIdx.length ? extra / neighborIdx.length : 0;
      neighborIdx.forEach((k) => {
        const reduction = Math.min(perNeighbor, widths[k] * 0.55);
        scale[k] = 1 - reduction / widths[k];
      });

      const first = Math.min(i, ...neighborIdx);
      const x = new Array(n).fill(0);
      let cumulative = 0;
      for (let k = first; k < n; k++) {
        x[k] = cumulative + (widths[k] * (scale[k] - 1)) / 2;
        cumulative += widths[k] * (scale[k] - 1);
      }

      const OUT_DURATION = 1.1;
      const RETURN_DURATION = 1.05;
      const continuous = gap === 0;

      ctx.add(() => {
        const tl = gsap.timeline(
          continuous ? {} : { onComplete: () => scheduleIdlePulse(wi, gap) },
        );
        if (continuous) {
          tl.call(() => scheduleIdlePulse(wi, 0), [], OUT_DURATION);
        }
        chars.forEach((el, k) => {
          if (scale[k] === 1 && x[k] === 0) return;
          tl.to(
            el,
            {
              scaleX: scale[k],
              x: x[k],
              duration: OUT_DURATION,
              ease: "power2.out",
            },
            0,
          );
        });
        chars.forEach((el, k) => {
          if (scale[k] === 1 && x[k] === 0) return;
          tl.to(
            el,
            {
              scaleX: 1,
              x: 0,
              duration: RETURN_DURATION,
              ease: "back.out(1.4)",
            },
            OUT_DURATION,
          );
        });
      });
    };

    const startIdlePulses = () => {
      if (reducedMotion) return;
      HERO_WORDS.forEach((_, wi) =>
        scheduleIdlePulse(wi, randRange(300, 1500)),
      );
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "+=140%",
          scrub: 1,
          pin: pinRef.current,
          pinSpacing: true,
          onUpdate: (self) => {
            scrollState.heroProgress = self.progress;
            scrollState.velocity = gsap.utils.clamp(
              -1,
              1,
              self.getVelocity() / 2000,
            );
          },
        },
      });

      tl.to(
        [titleDissolveRef.current, bgDissolveRef.current],
        reducedMotion
          ? { opacity: 0, ease: "none", duration: 0.4 }
          : {
              opacity: 0,
              filter: "blur(6px)",
              ease: "none",
              duration: 0.4,
            },
        0,
      ).to(fadeRef.current, { opacity: 1, ease: "none" }, 0.6);

      const chars = titleCharsRef.current.filter(
        (el): el is HTMLSpanElement => el != null,
      );
      gsap.set(
        chars,
        reducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              x: (i: number) => LETTER_OFFSETS[i % LETTER_OFFSETS.length].x,
              y: (i: number) => LETTER_OFFSETS[i % LETTER_OFFSETS.length].y,
              scaleX: (i: number) =>
                letterStretch(LETTER_OFFSETS[i % LETTER_OFFSETS.length]).scaleX,
              scaleY: (i: number) =>
                letterStretch(LETTER_OFFSETS[i % LETTER_OFFSETS.length]).scaleY,
            },
      );
    }, wrapperRef);

    const playEntrance = () => {
      ctx.add(() => {
        const chars = titleCharsRef.current.filter(
          (el): el is HTMLSpanElement => el != null,
        );

        if (reducedMotion) {
          gsap.to(chars, {
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.05,
          });
          return;
        }

        gsap.to(chars, {
          opacity: 1,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.045,
          onComplete: startIdlePulses,
        });
      });
    };
    window.addEventListener(INTRO_COMPLETE_EVENT, playEntrance, { once: true });

    return () => {
      window.removeEventListener(INTRO_COMPLETE_EVENT, playEntrance);
      idleTimers.forEach(clearTimeout);
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <section id="top" ref={wrapperRef} className="relative h-[240vh]">
      <div
        ref={pinRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-paper"
      >
        <div ref={bgDissolveRef} className="absolute inset-0">
          <HalftoneBackground />
        </div>

        <div className="absolute -inset-x-[16%] -top-[1%] -bottom-[26%] md:inset-0">
          <SceneErrorBoundary fallback={<div className="absolute inset-0" />}>
            <HeroScene />
          </SceneErrorBoundary>
        </div>

        <div className="pointer-events-none absolute inset-0 mix-blend-difference">
          <h1
            ref={titleDissolveRef}
            aria-label="Welcome to the house of online presence"
            className="absolute inset-0"
          >
            {HERO_WORDS.map((word, wi) => (
              <span
                key={word.text}
                aria-hidden="true"
                className={`absolute inline-block whitespace-nowrap font-display font-black uppercase leading-[0.85] tracking-wider text-white [font-variation-settings:'wght'_900,'CNTR'_0] ${word.size} ${word.position}`}
              >
                {word.text.split("").map((char, ci) => (
                  <span
                    key={ci}
                    ref={(el) => {
                      titleCharsRef.current[wordCharStarts[wi] + ci] = el;
                    }}
                    className="inline-block"
                  >
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </h1>
        </div>

        <div
          ref={fadeRef}
          className="pointer-events-none absolute inset-0 z-20 bg-paper opacity-0"
        />
      </div>
    </section>
  );
}
