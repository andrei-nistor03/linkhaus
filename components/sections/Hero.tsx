"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
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

export default function Hero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const bgDissolveRef = useRef<HTMLDivElement>(null);

  // Outer node fades in after the intro; inner node fades out at the end of
  // the hero scroll. Split so the two tweens never fight over one opacity.
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const scrollCueInnerRef = useRef<HTMLDivElement>(null);
  const scrollCueFillRef = useRef<HTMLSpanElement>(null);
  // The intro event fires once; remember it so an effect re-run (e.g. the
  // reduced-motion query resolving late) doesn't leave the cue hidden.
  const introDoneRef = useRef(false);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    registerGsap();

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
          },
        },
      });

      tl.to(
        bgDissolveRef.current,
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
      )
        .to(fadeRef.current, { opacity: 1, ease: "none", duration: 0.5 }, 0.6)
        // The cue tracks the whole hero scroll, then fades out over the last
        // stretch so it's gone by the time the next section arrives.
        .fromTo(
          scrollCueFillRef.current,
          { scaleX: 0 },
          { scaleX: 1, ease: "none", duration: 1.1 },
          0,
        )
        .to(
          scrollCueInnerRef.current,
          { opacity: 0, y: 12, ease: "none", duration: 0.1 },
          1.0,
        );

      if (!introDoneRef.current) gsap.set(scrollCueRef.current, { opacity: 0 });
    }, wrapperRef);

    const playEntrance = () => {
      introDoneRef.current = true;
      ctx.add(() => {
        gsap.to(scrollCueRef.current, {
          opacity: 1,
          duration: 0.8,
          delay: 0.3,
          ease: "power2.out",
        });
      });
    };
    window.addEventListener(INTRO_COMPLETE_EVENT, playEntrance, { once: true });

    return () => {
      window.removeEventListener(INTRO_COMPLETE_EVENT, playEntrance);
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <section id="top" ref={wrapperRef} className="relative h-[calc(var(--vh)*240)]">
      {/* The page's only h1: no visible title, but kept for screen readers
          and SEO. */}
      <h1 className="sr-only">Welcome to the house of online presence</h1>

      <div
        ref={pinRef}
        // lvh: the height of the screen once the mobile browser's toolbar
        // hides on scroll. Only the background layers fill it, so no blank
        // strip shows up under the toolbar when it slides away.
        className="sticky top-0 h-[calc(var(--lvh)*100)] w-full overflow-hidden bg-paper"
      >
        <div ref={bgDissolveRef} className="absolute inset-0">
          <HalftoneBackground />
        </div>

        {/* svh, not vh/lvh: the always-visible height (toolbar shown), so the
            scene and scroll cue fit on screen from the start and stay put
            when the toolbar hides. */}
        <div className="absolute inset-x-0 top-0 h-[calc(var(--svh)*100)]">
          <div className="absolute -inset-x-[16%] -top-[1%] -bottom-[26%] md:inset-0">
            <SceneErrorBoundary fallback={<div className="absolute inset-0" />}>
              <HeroScene />
            </SceneErrorBoundary>
          </div>

          {/* Above the paper fade (z-20) so it stays visible for the whole
              hero scroll. A solid ink pill reads on the scene and the paper
              fade alike; its bottom edge fills as the hero scrolls. */}
          <div
            ref={scrollCueRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center px-4 sm:bottom-8 lg:bottom-10"
          >
            {/* Styled like the nav's CTA pill: ink fill, paper mono label. */}
            <div
              ref={scrollCueInnerRef}
              className="font-mono-label relative flex items-center gap-3 overflow-hidden rounded-full border border-ink bg-ink py-2 pl-2 pr-5 text-paper shadow-[0_8px_30px_-8px_rgba(13,13,13,0.45)] sm:gap-3.5 sm:pr-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper/25 sm:h-10 sm:w-10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="scroll-cue-arrow h-4 w-4 sm:h-[18px] sm:w-[18px]"
                >
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </span>
              <span className="whitespace-nowrap text-xs uppercase tracking-[0.2em] sm:text-sm">
                Scroll to explore
              </span>
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-paper/10">
                <span
                  ref={scrollCueFillRef}
                  className="absolute inset-0 origin-left scale-x-0 bg-accent-violet"
                />
              </span>
            </div>
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
