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

// `pulseGap` is the idle animation's pause (ms) between one letter's
// stretch-and-return finishing and the next one starting, for the idle
// "rubber letter" loop below. The four content words read best pulsing
// continuously, letter after letter with no gap; the three short
// connector words get a full second to breathe between pulses so they
// don't feel like they're constantly fidgeting.
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
  // Every character of every scattered word gets its own DOM node here, in
  // HERO_WORDS order — the per-letter scatter-and-stretch entrance (see
  // LETTER_OFFSETS above) animates these directly, the same treatment
  // "Welcome" alone used to get before all seven words started using it.
  const titleCharsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const reducedMotion = useReducedMotion();

  // Each word's starting index into the flat titleCharsRef array, so every
  // word's <span> can register its characters at stable positions.
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

    // Idle "rubber letter" pulse: once a word has finished entering, it
    // periodically picks one of its own letters at random, stretches that
    // letter out and pulls its immediate left/right neighbors in to make
    // room, then springs everything back — and schedules its own next
    // pulse after that word's own `pulseGap` (see HERO_WORDS). Each word
    // runs its own fully independent loop, timed only against its own
    // letter count, not the others — so a 4-pulse word never inherits the
    // rhythm of a 2-letter one. Skipped entirely under reduced motion.
    //
    // scaleX alone can't drive this: a CSS transform doesn't reflow, so a
    // stretching letter would just visually bleed into neighbors that
    // "compressed" only in appearance, not in the space they occupy — they
    // could still touch or overlap. Instead every letter's real rest-state
    // width and position is measured fresh (getBoundingClientRect) right
    // before each pulse, exact new left edges are computed for every
    // letter that resizes, and each one gets a matching x offset alongside
    // its scaleX so the animated edges land exactly where the math says,
    // with the original inter-letter gap preserved throughout — letters
    // right up against the stretch never touch, by construction. Letters
    // outside the 3-letter window shift together as a rigid block to
    // absorb whatever net width the window gains or loses; letters before
    // the window don't move at all.
    const idleTimers: ReturnType<typeof setTimeout>[] = [];
    // The letter index each word stretched last time, so the next pick can
    // exclude it — otherwise Math.random() has no memory and the same
    // letter can (and, over enough pulses, will) come up several times in
    // a row, which reads as that one letter being singled out rather than
    // the word cycling through itself.
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
      // offsetWidth (layout width), not getBoundingClientRect — continuous
      // words (see below) can have their next pulse start while a
      // neighboring letter from the *previous* pulse is still mid-return,
      // and getBoundingClientRect would report that letter's transformed,
      // in-flight size instead of its true rest width.
      const widths = chars.map((el) => el.offsetWidth);

      const scale = new Array(n).fill(1);
      scale[i] = randRange(1.55, 1.85);

      const neighborIdx = [i - 1, i + 1].filter((k) => k >= 0 && k < n);
      const extra = widths[i] * (scale[i] - 1);
      const perNeighbor = neighborIdx.length ? extra / neighborIdx.length : 0;
      neighborIdx.forEach((k) => {
        // Cap how much any one neighbor gives up so a narrow letter next
        // to a wide, heavily-stretched one can't be squeezed past ~45%
        // of its own width.
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
      // Continuous words (gap 0) kick off their next letter's pulse as
      // soon as this one's stretch-out peaks, not once the whole cycle
      // (including the settle) finishes — so the next letter is already
      // stretching while this one is still springing back, an overlapping
      // cascade instead of a strict one-at-a-time queue. Gapped words wait
      // out the full cycle plus their pause.
      const continuous = gap === 0;

      ctx.add(() => {
        const tl = gsap.timeline(
          continuous ? {} : { onComplete: () => scheduleIdlePulse(wi, gap) },
        );
        if (continuous) {
          tl.call(() => scheduleIdlePulse(wi, 0), [], OUT_DURATION);
        }
        chars.forEach((el, k) => {
          if (scale[k] === 1 && x[k] === 0) return; // untouched, nothing to tween
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
        // Starts once the stretch-out fully finishes, not "<" (which would
        // anchor to the previous tween's own start time — 0 — and race it).
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

      // Scroll-out: the title stays exactly where it is on screen (no
      // position or scale change) and simply blurs out as it fades — kept
      // deliberately separate from the entrance/idle animations above. The
      // halftone canvas gets the identical treatment, in lockstep with the
      // title, before the paper overlay covers everything. The 3D scene is
      // deliberately excluded — it stays sharp all the way through.
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
