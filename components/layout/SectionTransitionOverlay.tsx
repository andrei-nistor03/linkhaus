"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";
import { lenisState } from "@/lib/lenisState";
import { setNavTransitionHandler } from "@/lib/navTransitionState";
import type { LoadingStage } from "@/lib/useLoadingProgress";
import LoadingVisual from "@/components/preloader/LoadingVisual";

const FILL_DURATION = 0.55;
const REVEAL_DELAY = 0.15;

const CONTACT_SETTLE_SCROLL = 300;
// On touch the nav lands deep into Contact's sticky scroll range, just before
// its content starts fading out (CONTENT_FADE_FROM = 0.82 in Contact.tsx).
const CONTACT_TOUCH_LANDING = 0.7;

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

    const lenis = lenisState.instance;
    // lenis.stop() already blocks scrolling. Locking the root's overflow would
    // make <html> the scrollport and un-stick Contact's sticky panel, so it's
    // only a fallback for when Lenis isn't running.
    if (lenis) lenis.stop();
    else document.documentElement.style.overflow = "hidden";

    const jump = () => {
      const target = targetRef.current;
      if (!target) return;
      const el = document.querySelector<HTMLElement>(target);
      if (!el) return;
      // Measure against the real window scroll: after a native touch fling,
      // Lenis's own scroll value can lag behind, which made element targets
      // land short. Contact also goes straight past its transition veil.
      let top = el.getBoundingClientRect().top + window.scrollY;
      if (target === "#contact") {
        top += isTouch
          ? (el.offsetHeight - window.innerHeight) * CONTACT_TOUCH_LANDING
          : CONTACT_SETTLE_SCROLL;
      }
      if (lenis) {
        lenis.scrollTo(top, { immediate: true, force: true });
      } else {
        window.scrollTo(0, top);
      }
      ScrollTrigger.update();
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
      lenis?.start();
      document.documentElement.style.overflow = "";
      inFlightRef.current = false;
      targetRef.current = null;
      setActive(false);
    });

    return () => {
      tl.kill();
    };
  }, [active, isTouch]);

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
