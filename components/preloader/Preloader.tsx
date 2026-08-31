"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useLoadingProgress } from "@/lib/useLoadingProgress";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";
import LoadingVisual from "./LoadingVisual";

export const INTRO_COMPLETE_EVENT = "linkhaus:intro-complete";

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

  useEffect(() => {
    if (!isReady || exiting) return;
    setExiting(true);

    const grain = document.querySelector<HTMLElement>(".grain");

    const tl = gsap.timeline({
      delay: reducedMotion ? 0 : 0.4,
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
