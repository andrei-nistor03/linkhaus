"use client";

import { useEffect, useRef, useState } from "react";
import { threeLoading as three } from "./loadingTracker";

export type LoadingStage = "loading" | "active" | "prime" | "exit";

export interface LoadingProgressHandle {
  progressRef: React.MutableRefObject<number>;
  stage: LoadingStage;
  isReady: boolean;
}

const DRIFT_CAP = 92;
const FONT_WEIGHT = 0.2;
const THREE_WEIGHT = 0.8;
const HARD_TIMEOUT_MS = 7000;

function stageForProgress(p: number): LoadingStage {
  if (p >= 100) return "exit";
  if (p >= 95) return "prime";
  if (p >= 70) return "active";
  return "loading";
}

export function useLoadingProgress(minVisibleMs = 900): LoadingProgressHandle {
  const progressRef = useRef(0);
  const [stage, setStage] = useState<LoadingStage>("loading");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const start = performance.now();

    let fontsDone = false;

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) fontsDone = true;
      });
    } else {
      fontsDone = true;
    }

    let driftTarget = 0;
    let display = 0;
    let lastStage: LoadingStage = "loading";

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;

      const threeFrac = three.done
        ? 1
        : three.total > 0
          ? Math.min(1, three.loaded / three.total)
          : three.started
            ? 0.12
            : 0;
      const rawFrac = Math.min(1, (fontsDone ? FONT_WEIGHT : 0) + threeFrac * THREE_WEIGHT);

      const allLoaded = fontsDone && (three.done || elapsed > HARD_TIMEOUT_MS);
      const readyToFinish = allLoaded && elapsed >= minVisibleMs;

      driftTarget = Math.min(DRIFT_CAP, driftTarget + 0.75);
      const target = readyToFinish ? 100 : Math.min(DRIFT_CAP, Math.max(rawFrac * 100, driftTarget));
      display += (target - display) * 0.08;
      if (readyToFinish && target - display < 0.6) display = 100;
      display = Math.min(100, display);
      progressRef.current = display;

      const nextStage = stageForProgress(display);
      if (nextStage !== lastStage) {
        lastStage = nextStage;
        setStage(nextStage);
      }
      // Done: stop ticking instead of running for the rest of the visit.
      if (display >= 100 && readyToFinish) {
        setIsReady(true);
        return;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return { progressRef, stage, isReady };
}
