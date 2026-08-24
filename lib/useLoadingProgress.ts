"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type LoadingStage = "loading" | "active" | "prime" | "exit";

export interface LoadingProgressHandle {
  /**
   * Smoothed 0-100 display value. Lives on a ref and is written every
   * animation frame — read it directly (in a rAF loop or a GSAP ticker
   * callback) rather than re-rendering React off of it. Same reasoning as
   * `scrollState` in lib/scrollState.ts: this number changes ~60x/sec and
   * nothing needs a component re-render for that.
   */
  progressRef: React.MutableRefObject<number>;
  /** Coarse activity band derived from the smoothed value, for pacing how
   *  busy the surrounding typography/messages feel. Changes only a handful
   *  of times total, so this is plain React state. */
  stage: LoadingStage;
  /** True once every tracked critical asset has actually resolved. */
  criticalAssetsLoaded: boolean;
  /** True once criticalAssetsLoaded AND the smoothed display value has
   *  actually caught up to 100 — the real "safe to exit" signal. */
  isReady: boolean;
}

// Below this the displayed number never actually reflects real load
// progress on its own — see the drift explanation below.
const DRIFT_CAP = 92;
// How much of the smoothed value fonts vs. the three.js pipeline (the
// hero's glb + wall texture) are allowed to account for. The three.js load
// is the heavier one, so it carries most of the weight.
const FONT_WEIGHT = 0.2;
const THREE_WEIGHT = 0.8;
// If the three.js loading manager never reports anything at all (e.g. dev
// cache, or the request finished before this hook's effect could attach its
// listeners), don't hold the site hostage waiting for an event that isn't
// coming.
const HARD_TIMEOUT_MS = 7000;

function stageForProgress(p: number): LoadingStage {
  if (p >= 100) return "exit";
  if (p >= 95) return "prime";
  if (p >= 70) return "active";
  return "loading";
}

/**
 * Tracks the site's actual critical-path loading — document fonts, plus
 * whatever three.js pulls through `THREE.DefaultLoadingManager` (the hero's
 * GLTF model and wall texture, both preloaded as soon as HeroScene's chunk
 * evaluates, see WallsModel.tsx) — and turns it into one smoothed number the
 * preloader can show.
 *
 * The raw asset fraction and the number actually displayed are deliberately
 * decoupled. Real progress can jump (a glb finishing in a single tick) or
 * stall (a slow connection sitting at 40% for a while); the displayed value
 * instead eases toward it and keeps drifting forward on its own, capped
 * below 100, so the loading screen never reads as frozen while it waits.
 * It's only allowed to actually reach 100 once every critical asset is
 * genuinely done AND the screen has been up for `minVisibleMs` — so a
 * near-instant warm-cache load still gets a moment to register instead of
 * flashing past.
 *
 * @param minVisibleMs Minimum time the loading sequence stays up even if
 *   every asset resolves instantly. Pass a small value under reduced
 *   motion — see Preloader.tsx.
 */
export function useLoadingProgress(minVisibleMs = 900): LoadingProgressHandle {
  const progressRef = useRef(0);
  const [stage, setStage] = useState<LoadingStage>("loading");
  const [criticalAssetsLoaded, setCriticalAssetsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const start = performance.now();

    let fontsDone = false;
    const three = { loaded: 0, total: 0, started: false, done: false };

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) fontsDone = true;
      });
    } else {
      fontsDone = true;
    }

    // THREE.DefaultLoadingManager is the manager every loader in this app
    // uses implicitly (useGLTF/useTexture don't pass one of their own) —
    // hooking its callbacks here is the only place that sees real load
    // progress for the hero's model/texture pipeline. Previous handlers are
    // saved and chained through rather than overwritten, in case anything
    // else in the tree ever relies on them too.
    const manager = THREE.DefaultLoadingManager;
    const prev = {
      onStart: manager.onStart,
      onProgress: manager.onProgress,
      onLoad: manager.onLoad,
      onError: manager.onError,
    };
    manager.onStart = (url, loaded, total) => {
      three.started = true;
      three.loaded = loaded;
      three.total = total;
      prev.onStart?.(url, loaded, total);
    };
    manager.onProgress = (url, loaded, total) => {
      three.loaded = loaded;
      three.total = total;
      prev.onProgress?.(url, loaded, total);
    };
    manager.onLoad = () => {
      three.done = true;
      prev.onLoad?.();
    };
    manager.onError = (url) => {
      // A failed model/texture request shouldn't hang the whole site behind
      // the preloader forever — treat it as resolved and let HeroScene's
      // own error boundary handle the visual fallback.
      three.done = true;
      prev.onError?.(url);
    };

    let driftTarget = 0;
    let display = 0;
    let lastStage: LoadingStage = "loading";
    let allLoadedNotified = false;
    let readyNotified = false;

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;

      const threeFrac = three.done
        ? 1
        : three.total > 0
          ? Math.min(1, three.loaded / three.total)
          : three.started
            ? 0.12 // request is in flight but no byte counts yet
            : 0;
      const rawFrac = Math.min(1, (fontsDone ? FONT_WEIGHT : 0) + threeFrac * THREE_WEIGHT);

      const allLoaded = fontsDone && (three.done || elapsed > HARD_TIMEOUT_MS);
      if (allLoaded && !allLoadedNotified) {
        allLoadedNotified = true;
        setCriticalAssetsLoaded(true);
      }
      const readyToFinish = allLoaded && elapsed >= minVisibleMs;

      // Drift target crawls upward on its own regardless of real progress —
      // this is what keeps the number (and anything visually tied to it)
      // moving on a slow connection instead of sitting still.
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
      if (display >= 100 && readyToFinish && !readyNotified) {
        readyNotified = true;
        setIsReady(true);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      manager.onStart = prev.onStart;
      manager.onProgress = prev.onProgress;
      manager.onLoad = prev.onLoad;
      manager.onError = prev.onError;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- minVisibleMs is
    // only ever set once per mount (reducedMotion doesn't change mid-load).
  }, []);

  return { progressRef, stage, criticalAssetsLoaded, isReady };
}
