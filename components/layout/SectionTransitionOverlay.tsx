"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";
import { lenisState } from "@/lib/lenisState";
import { setNavTransitionHandler } from "@/lib/navTransitionState";
import type { LoadingStage } from "@/lib/useLoadingProgress";
import LoadingVisual from "@/components/preloader/LoadingVisual";

const FILL_DURATION = 0.55;
const REVEAL_DELAY = 0.15;

const CONTACT_SETTLE_SCROLL = 300;

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
        lenis.scrollTo(target, { immediate: true, force: true });
      } else {
        const el = document.querySelector(target);
        el?.scrollIntoView();
      }
    };

    const tl = gsap.timeline();
    const progress = { value: 0 };

    if (reducedMotion) {
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
      setActive(false);

      if (target === "#contact" && lenis) {
        lenis.scrollTo(lenis.scroll + CONTACT_SETTLE_SCROLL);
      }
    });

    return () => {
      tl.kill();
    };
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
