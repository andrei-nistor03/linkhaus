"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";
import { lenisState } from "@/lib/lenisState";
import { setNavTransitionHandler } from "@/lib/navTransitionState";
import type { LoadingStage } from "@/lib/useLoadingProgress";
import LoadingVisual from "@/components/preloader/LoadingVisual";

/** How long the ring takes to sweep 0 -> 100 before the jump fires. Kept
 *  short — this is standing in for real load progress, there's nothing to
 *  actually wait on, so it just needs enough time to read as a beat rather
 *  than a flash. */
const FILL_DURATION = 0.55;
/** Delay between the jump landing and the wipe-out starting, echoing
 *  Preloader's own "let the burst register" pause before it reveals what's
 *  underneath. */
const REVEAL_DELAY = 0.15;

/**
 * A small extra scroll, eased in after the reveal has fully finished (not
 * baked into the jump's own landing spot — a larger jump target was tried
 * there and reintroduced the snap/wash bug this component used to have, see
 * git history), just for Contact: its opening content sits flush with the
 * section's very top, so a bare landing puts it right at the top edge.
 */
const CONTACT_SETTLE_SCROLL = 300;

/**
 * The loader-and-teleport transition Nav.tsx and Footer.tsx's internal
 * anchor links use in place of a smooth scroll: covers the screen with the
 * same particle-ring visual Preloader.tsx opens the site with, jumps the
 * page straight to the requested section while hidden behind it, then wipes
 * away to reveal the destination already in place. Mounted once in
 * app/page.tsx; everywhere else just calls requestSectionTransition (see
 * lib/navTransitionState.ts) and never touches this component directly.
 *
 * Unlike Preloader, the progress ring here isn't tracking anything real —
 * there's no asset pipeline to wait on for an in-page jump — so it's driven
 * by a plain fixed-duration tween instead of useLoadingProgress.
 */
export default function SectionTransitionOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const targetRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const [active, setActive] = useState(false);
  const [stage, setStage] = useState<LoadingStage>("active");
  const [exploding, setExploding] = useState(false);

  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouch();

  useEffect(() => {
    registerGsap();
  }, []);

  useEffect(() => {
    const run = (target: string) => {
      // Ignore re-entrant requests (a second click mid-transition) rather
      // than queuing or restarting — the whole sequence is well under a
      // second, so a stray extra click just gets dropped.
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      targetRef.current = target;
      progressRef.current = 0;
      setStage("active");
      setExploding(false);
      setActive(true);
    };
    setNavTransitionHandler(run);
    return () => setNavTransitionHandler(null);
  }, []);

  // The actual sequence, run once the overlay has mounted (rootRef exists)
  // for this activation.
  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;

    document.documentElement.style.overflow = "hidden";
    const lenis = lenisState.instance;
    lenis?.stop();

    const jump = () => {
      const target = targetRef.current;
      if (!target) return;
      if (lenis) {
        // `force: true` — lenis.stop() (called above, to block user input
        // for the duration of the transition) makes scrollTo a no-op
        // otherwise; force is what lets a programmatic jump through while
        // stopped.
        lenis.scrollTo(target, { immediate: true, force: true });
      } else {
        const el = document.querySelector(target);
        el?.scrollIntoView();
      }
    };

    const tl = gsap.timeline();
    const progress = { value: 0 };

    if (reducedMotion) {
      // No entrance/exit motion, but still a brief, visible hold — an
      // instant cut would read as a broken click, not a deliberate
      // transition.
      tl.set(root, { opacity: 1 })
        .to(progress, {
          value: 100,
          duration: 0.15,
          onUpdate: () => {
            progressRef.current = progress.value;
          },
          onComplete: () => {
            jump();
            setExploding(true);
          },
        })
        .to(root, { opacity: 0, duration: 0.2, ease: "power1.in" }, "+=0.1");
    } else {
      tl.fromTo(
        root,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" },
      )
        .to(
          progress,
          {
            value: 100,
            duration: FILL_DURATION,
            ease: "power2.inOut",
            onUpdate: () => {
              progressRef.current = progress.value;
              if (progress.value > 60) setStage("prime");
            },
            onComplete: () => {
              jump();
              setExploding(true);
            },
          },
          "-=0.05",
        )
        .to(
          root,
          { yPercent: -100, duration: 0.7, ease: "expo.inOut" },
          `+=${REVEAL_DELAY}`,
        );
    }

    tl.eventCallback("onComplete", () => {
      const target = targetRef.current;
      lenis?.start();
      document.documentElement.style.overflow = "";
      inFlightRef.current = false;
      targetRef.current = null;
      // No clearProps here: setActive(false) unmounts `root` entirely on
      // the next render, so there's nothing to reset. Stripping its
      // opacity/yPercent inline styles first (as this used to) snapped the
      // still-mounted, still-opaque overlay back on-screen for one paint
      // before React actually removed it — a one-frame flash back to fully
      // covering the page right as the transition finished.
      setActive(false);

      // A real, eased scroll — not part of the jump above — kicked off
      // only now that the page is fully revealed and interactive, so it
      // can't interact with any section's own scroll-triggered entrance
      // state the way landing further into the jump itself once did.
      if (target === "#contact" && lenis) {
        lenis.scrollTo(lenis.scroll + CONTACT_SETTLE_SCROLL);
      }
    });

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per
    // activation; reducedMotion is read, not a re-trigger mid-sequence.
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] overflow-hidden bg-paper"
      aria-hidden="true"
    >
      <LoadingVisual
        progressRef={progressRef}
        stage={stage}
        exploding={exploding}
        reducedMotion={reducedMotion}
        isTouch={isTouch}
      />
    </div>
  );
}
