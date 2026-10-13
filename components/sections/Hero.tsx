"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { scrollState } from "@/lib/scrollState";
import { isTouchDevice, useReducedMotion } from "@/lib/useMediaQuery";
import SceneErrorBoundary from "@/components/three/SceneErrorBoundary";
import HalftoneBackground from "@/components/hero/HalftoneBackground";
import { INTRO_COMPLETE_EVENT } from "@/components/layout/Preloader";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

// Phones: each word is sized by min(vw, svh) so it scales with the screen's
// width and height. The numbers match the old fixed sizes on a 390×844 screen.
// md+ (tablet and desktop): the desktop layout, sized purely in vw so tablets
// get a scaled-down copy of it. Tablets (md→lg) bump the sizes ~25% (only ~10%
// for "to"/"the", which sit side by side) to fill the space while keeping
// every word clear of its neighbours.
const HERO_WORDS: {
  text: string;
  size: string;
  position: string;
  pulseGap: number;
}[] = [
  {
    text: "Welcome",
    size: "text-[length:min(24.5vw,11.4svh)] md:text-[16.25vw] lg:text-[length:min(13vw,24rem)]",
    position: "left-[10%] top-[13%] text-left md:left-[11%] md:top-[15%]",
    pulseGap: 0,
  },
  {
    text: "to",
    size: "text-[length:min(20.5vw,9.5svh)] md:text-[11vw] lg:text-[length:min(10vw,20rem)]",
    position: "left-[62%] top-[25%] text-left md:left-[62%] md:top-[20%]",
    pulseGap: 1000,
  },
  {
    text: "the",
    size: "text-[length:min(28.7vw,13.3svh)] md:text-[15.4vw] lg:text-[length:min(14vw,24rem)]",
    position:
      "left-[10%] top-[30%] text-left md:left-auto md:right-[9%] md:top-[19%]",
    pulseGap: 1000,
  },
  {
    text: "house",
    size: "text-[length:min(20.5vw,9.5svh)] md:text-[15vw] lg:text-[length:min(12vw,20rem)]",
    position: "left-[9%] top-[41%] text-left md:left-[11%] md:top-[47%]",
    pulseGap: 0,
  },
  {
    text: "of",
    size: "text-[length:min(32.8vw,15.2svh)] md:text-[18.75vw] lg:text-[length:min(15vw,24rem)]",
    position: "right-[10%] top-[42%] text-right md:right-[25%] md:top-[45%]",
    pulseGap: 1000,
  },
  {
    text: "online",
    size: "text-[length:min(16.4vw,7.6svh)] md:text-[12.5vw] lg:text-[length:min(10vw,18rem)]",
    position: "left-[8%] top-[76%] text-left md:left-[13%] md:top-[72%]",
    pulseGap: 0,
  },
  {
    text: "presence",
    size: "text-[length:min(20.5vw,9.5svh)] md:text-[12.5vw] lg:text-[length:min(10vw,16rem)]",
    position:
      "left-[8%] top-[86%] text-left md:left-auto md:right-[12%] md:top-[74%]",
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
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorTextRef = useRef<HTMLDivElement>(null);

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
        // No GSAP `pin`: the panel is already CSS-sticky. Pinning it as well
        // flipped it to position:fixed from JS, which lags behind mobile
        // momentum scrolling and instant jumps (back-to-top) and left the
        // background misplaced. The range is exactly how long it stays stuck.
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: () =>
            `+=${Math.max(1, wrapperRef.current!.offsetHeight - pinRef.current!.offsetHeight)}`,
          invalidateOnRefresh: true,
          scrub: 1,
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
        [
          titleDissolveRef.current,
          bgDissolveRef.current,
          scrollIndicatorRef.current,
          scrollIndicatorTextRef.current,
        ],
        // Phones skip the blur: it would re-blur the halftone canvas (redrawn
        // every frame) on every frame of the scroll-out.
        reducedMotion || isTouchDevice()
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
        // lvh: the height of the screen once the mobile browser's toolbar
        // hides on scroll. Only the background layers fill it, so no blank
        // strip shows up under the toolbar when it slides away.
        className="sticky top-0 h-lvh w-full overflow-hidden bg-paper"
      >
        <div ref={bgDissolveRef} className="absolute inset-0">
          <HalftoneBackground />
        </div>

        {/* svh, not vh/lvh: the always-visible height (toolbar shown), so the
            title, scene and scroll cue all fit on screen from the start and
            stay put when the toolbar hides. */}
        <div className="absolute inset-x-0 top-0 h-svh">
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
            ref={scrollIndicatorRef}
            aria-hidden="true"
            className="absolute bottom-0 right-0 z-10 h-56 w-20 rounded-tl-[2.5rem] bg-white mix-blend-difference sm:h-72 sm:w-24 sm:rounded-tl-[3rem] lg:h-96 lg:w-28 lg:rounded-tl-[4rem]"
          />
          <div
            ref={scrollIndicatorTextRef}
            aria-hidden="true"
            className="absolute bottom-0 right-0 z-10 flex h-56 w-20 flex-col items-center py-4 sm:h-72 sm:w-24 sm:py-5 lg:h-96 lg:w-28 lg:py-6"
          >
            <span className="flex flex-col items-center font-display text-2xl font-black uppercase leading-none text-white [font-variation-settings:'wght'_900,'CNTR'_0] sm:text-3xl lg:text-4xl">
              {"Scroll".split("").map((char, i) => (
                <span
                  key={i}
                  className={`scale-x-125 ${i === 0 ? "" : "-mt-1 sm:-mt-1.5 lg:-mt-2"}`}
                >
                  {char}
                </span>
              ))}
            </span>
            <span className="relative -mt-1 w-1 flex-1 overflow-hidden rounded-full bg-white/60 sm:-mt-1.5 sm:w-1.5 lg:-mt-2">
              <span className="scroll-indicator-dot absolute inset-x-0 top-0 h-4 rounded-full bg-white sm:h-5" />
            </span>
          </div>
        </div>

        <div
          ref={fadeRef}
          className="pointer-events-none absolute inset-0 z-20 bg-paper opacity-0"
        />
      </div>
    </section>
  );
}
