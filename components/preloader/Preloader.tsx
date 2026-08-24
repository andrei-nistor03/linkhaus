"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useLoadingProgress } from "@/lib/useLoadingProgress";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";
import LoadingVisual from "./LoadingVisual";

export const INTRO_COMPLETE_EVENT = "linkhaus:intro-complete";

/**
 * The site's opening scene: a plain paper-colored screen holding one thing —
 * LoadingVisual's ring of particles — while real critical-path loading
 * (fonts + the hero's GLTF/texture pipeline, see useLoadingProgress) happens
 * behind it. Exits only once that work has actually finished, dispatching
 * INTRO_COMPLETE_EVENT so Hero/Nav can start their own entrance timelines in
 * lockstep instead of everything animating in at once on mount — see
 * Hero.tsx and Nav.tsx.
 *
 * Deliberately minimal: no wordmark, no corner details, no on-screen
 * progress text. The particle ring itself (brightness sweeping around it,
 * spin speeding up, then bursting apart at 100%) is the entire loading
 * screen — see LoadingVisual's own comment.
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouch();
  const { progressRef, stage, isReady } = useLoadingProgress(reducedMotion ? 150 : 900);

  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    registerGsap();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  // The cinematic exit: fires exactly once, the moment the real assets are
  // ready and the visual counter has genuinely caught up to 100 (isReady —
  // see useLoadingProgress). The particle burst itself lives in
  // LoadingVisual; this just gives it a beat to register, briefly
  // intensifies the app's own grain layer, then wipes the whole screen away
  // to reveal the hero — already mounted and rendered underneath this
  // overlay the entire time — before dispatching INTRO_COMPLETE_EVENT.
  useEffect(() => {
    if (!isReady || exiting) return;
    setExiting(true);

    const grain = document.querySelector<HTMLElement>(".grain");

    const tl = gsap.timeline({
      delay: reducedMotion ? 0 : 0.4, // let the burst in LoadingVisual register first
      onComplete: () => {
        document.documentElement.style.overflow = "";
        window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT));
        setDone(true);
      },
    });

    if (reducedMotion) {
      tl.to(rootRef.current, { opacity: 0, duration: 0.35, ease: "power2.out" });
    } else {
      if (grain) {
        tl.to(grain, { opacity: 0.16, duration: 0.12, yoyo: true, repeat: 1 }, 0);
      }
      tl.to(rootRef.current, { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, 0.2);
    }

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires exactly
    // once when isReady flips true; exiting/reducedMotion are read, not
    // re-triggers.
  }, [isReady]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] overflow-hidden bg-paper"
      aria-hidden="true"
    >
      <LoadingVisual
        progressRef={progressRef}
        stage={stage}
        exploding={exiting}
        reducedMotion={reducedMotion}
        isTouch={isTouch}
      />
    </div>
  );
}
