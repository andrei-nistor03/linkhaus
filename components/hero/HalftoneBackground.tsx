"use client";

import { useEffect, useRef } from "react";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

const DOT_COLOR = "13, 13, 13";
const HOVER_RADIUS = 200; // px, falloff radius around each trail point
const TRAIL_SAMPLE_INTERVAL = 20; // ms between recorded trail points
const TRAIL_DURATION = 1000; // ms a trail point keeps influencing dots before fully fading
const MAX_TRAIL_POINTS = 100;

// Multiplier on how fast the idle terrain/grain noise drifts. 1 = current
// speed; try ~0.3 for a slow, calm drift or 2-3+ for something busier. This
// scales both noise layers together so their relative speeds (which keep
// the motion looking diagonal/organic instead of a straight pan) stay
// consistent — just change this one number to test.
const IDLE_SPEED = 4;

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

/** Smoothstep, used everywhere below instead of linear lerps so every fade
 *  (radial falloff, trail age, noise interpolation) eases in/out instead of
 *  changing at a constant rate — that's what reads as "smooth". */
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Small deterministic integer hash -> [0, 1). No Math.random anywhere, so
 *  the field is stable across frames; only its (x, y, t) inputs move. */
function hash(ix: number, iy: number) {
  let h = ix * 374761393 + iy * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

/** Classic bilinear value noise. Unlike sin(x)*cos(y), it has no repeating
 *  grid-aligned symmetry — it reads as organic, patchy "terrain" instead of
 *  a checkerboard. */
function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const sx = smooth(x - x0);
  const sy = smooth(y - y0);
  const n00 = hash(x0, y0);
  const n10 = hash(x0 + 1, y0);
  const n01 = hash(x0, y0 + 1);
  const n11 = hash(x0 + 1, y0 + 1);
  const ix0 = n00 + (n10 - n00) * sx;
  const ix1 = n01 + (n11 - n01) * sx;
  return ix0 + (ix1 - ix0) * sy;
}

export default function HalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isTouch = useIsTouch();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spacing = isTouch ? 26 : 20;
    const maxRadius = spacing * 0.34;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;

    let trail: TrailPoint[] = [];
    let lastSampleAt = 0;
    let raf = 0;

    function resize() {
      const rect = parent!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const now = performance.now();
      if (now - lastSampleAt < TRAIL_SAMPLE_INTERVAL) return;
      lastSampleAt = now;
      trail.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: now });
      if (trail.length > MAX_TRAIL_POINTS) trail.shift();
    }

    if (!isTouch) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    const started = performance.now();

    function draw(now: number) {
      const t = (now - started) / 1000;
      if (trail.length) trail = trail.filter((p) => now - p.t < TRAIL_DURATION);

      ctx!.clearRect(0, 0, width, height);

      for (let iy = 0; iy < rows; iy++) {
        const y = iy * spacing;
        for (let ix = 0; ix < cols; ix++) {
          const x = ix * spacing;

          // Broad, drifting noise: which patches of the field sit "higher"
          // right now (bigger base dots, bigger size ceiling).
          const terrain = valueNoise(
            x * 0.0085 + t * 0.16 * IDLE_SPEED,
            y * 0.0085 - t * 0.11 * IDLE_SPEED,
          );
          // Finer, faster noise layered on top for texture within a patch.
          const grain = valueNoise(
            x * 0.03 - t * 0.3 * IDLE_SPEED,
            y * 0.03 + t * 0.24 * IDLE_SPEED,
          );

          const idle = 0.16 + terrain * 0.44 + grain * 0.24;
          const localCeiling = maxRadius * (0.65 + terrain * 0.75);

          let boost = 0;
          for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            const dx = x - p.x;
            const dy = y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq >= HOVER_RADIUS * HOVER_RADIUS) continue;
            const dist = Math.sqrt(distSq);
            const falloff = smooth(1 - dist / HOVER_RADIUS);
            const age = now - p.t;
            const ageFade = smooth(1 - age / TRAIL_DURATION);
            const v = falloff * ageFade;
            if (v > boost) boost = v;
          }

          const level = Math.min(1, idle + boost);
          if (level < 0.045) continue;

          const radius = level * localCeiling;
          ctx!.globalAlpha = Math.min(1, 0.2 + level * 0.85);
          ctx!.fillStyle = `rgb(${DOT_COLOR})`;
          ctx!.beginPath();
          ctx!.arc(x, y, radius, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    function loop(now: number) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    if (reducedMotion) {
      draw(started + 1);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [isTouch, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
