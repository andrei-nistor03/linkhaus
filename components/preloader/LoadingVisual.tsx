"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { LoadingStage } from "@/lib/useLoadingProgress";

const PARTICLE_COUNT = 36;
// A CSS length expression rather than a plain number so the ring scales
// with viewport width between the clamped min/max instead of jumping at a
// breakpoint.
const RADIUS = "clamp(56px, 8vw, 104px)";

interface LoadingVisualProps {
  progressRef: React.MutableRefObject<number>;
  stage: LoadingStage;
  /** True for the ~0.6s burst once critical assets are ready. */
  exploding: boolean;
  reducedMotion: boolean;
  isTouch: boolean;
}

/** Small deterministic hash -> [0, 1), same shape as HalftoneBackground's.
 *  This component renders during SSR (Preloader isn't dynamically
 *  imported — it needs to paint before the rest of the client bundle is
 *  ready), so anything that varies per particle has to be seeded off the
 *  particle's own index rather than Math.random(), or the server and
 *  client would compute different values and React would flag a hydration
 *  mismatch on every particle. */
function hash(i: number, salt: number) {
  let h = (i * 374761393 + salt * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * The entire loading visual: a ring of particles arranged evenly around a
 * shared center, spinning continuously. Each particle sits at a fixed angle
 * on the ring (set once, via its own static `rotate()`); the whole ring
 * spins by animating one shared `rotateZ` on the container, and each
 * particle's own radius (its `translateY`) is what the progress fill and
 * the exit burst animate — so "how far from center" is the one property
 * doing double duty as both the loading indicator and the break-apart
 * effect, instead of two separate systems.
 *
 * Progress is shown by brightening the particles up to `progress%` of the
 * way around the ring — a "loading dial" made only of dots, no text or
 * bars. At 100%, every particle flies outward along its own angle and
 * fades, clearing the screen for the hero underneath.
 */
export default function LoadingVisual({
  progressRef,
  stage,
  exploding,
  reducedMotion,
  isTouch,
}: LoadingVisualProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  // The infinite spin tween itself, so its speed can be adjusted later
  // (stage changes, the exit burst) without re-creating it — `timeScale`
  // lives on the tween instance, not on the DOM element it animates.
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (360 / PARTICLE_COUNT) * i,
        size: 3 + hash(i, 1) * 3,
      })),
    [],
  );

  // The ring's own continuous spin — independent of load progress, so the
  // screen is visibly alive even while the network stalls. Speeds up once
  // the load is nearly done (see useLoadingProgress's `stage`), reading as
  // anticipation rather than just "faster for no reason".
  useEffect(() => {
    if (reducedMotion || !ringRef.current) return;
    const tween = gsap.to(ringRef.current, {
      rotateZ: "+=360",
      duration: 10,
      repeat: -1,
      ease: "none",
    });
    spinTweenRef.current = tween;
    return () => {
      tween.kill();
      spinTweenRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    const speed = stage === "active" ? 1.6 : stage === "prime" ? 2.4 : 1;
    spinTweenRef.current?.timeScale(speed);
  }, [stage]);

  // Progress fill: brightens particles up to `progress%` around the ring,
  // with a small brighter "head" right at the sweep edge. Written straight
  // to each dot's style every frame rather than through React state/props
  // — see useLoadingProgress's own comment for why nothing this frequent
  // goes through a re-render.
  useEffect(() => {
    if (exploding) return;
    let raf = 0;
    const loop = () => {
      const p = progressRef.current;
      const litCount = (p / 100) * PARTICLE_COUNT;
      dotRefs.current.forEach((el, i) => {
        if (!el) return;
        const distanceFromEdge = litCount - i;
        let opacity: number;
        let scale: number;
        if (distanceFromEdge > 1) {
          opacity = 0.85;
          scale = 1;
        } else if (distanceFromEdge > 0) {
          // The one particle currently at the sweep edge — brighter and
          // slightly larger, like a comet head leading the fill.
          opacity = 1;
          scale = 1.4;
        } else {
          opacity = 0.12;
          scale = 0.7;
        }
        el.style.opacity = String(opacity);
        el.style.setProperty("--dot-scale", String(scale));
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, exploding]);

  // Mouse parallax tilt — a separate node from the one the continuous spin
  // runs on, so the two rotations compose instead of one fighting the
  // other for the same axis.
  useEffect(() => {
    if (reducedMotion || isTouch || !tiltRef.current) return;
    const el = tiltRef.current;
    const setX = gsap.quickTo(el, "rotateX", { duration: 0.7, ease: "power3.out" });
    const setY = gsap.quickTo(el, "rotateY", { duration: 0.7, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      setX(-ny * 8);
      setY(nx * 8);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion, isTouch]);

  // Exit: every particle rushes outward along its own fixed angle and
  // fades, in place of a separate "explosion" object — the ring itself
  // breaks apart.
  useEffect(() => {
    if (!exploding) return;
    const tl = gsap.timeline();
    // `timeScale` lives on the tween instance, not on the element — see
    // spinTweenRef above.
    spinTweenRef.current?.timeScale(reducedMotion ? 1 : 5);
    const nodes = dotRefs.current.filter((el): el is HTMLDivElement => el != null);
    tl.to(
      nodes,
      {
        y: reducedMotion ? "-=20" : "-=180",
        opacity: 1,
        scale: 1.6,
        duration: reducedMotion ? 0.3 : 0.6,
        stagger: { each: 0.006, from: "random" },
        ease: "power2.in",
      },
      reducedMotion ? 0 : 0.05,
    ).to(nodes, { opacity: 0, duration: 0.3, ease: "power1.in" }, reducedMotion ? 0.1 : 0.45);
    return () => {
      tl.kill();
    };
  }, [exploding, reducedMotion]);

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ perspective: "900px" }}
    >
      <div ref={tiltRef} style={{ transformStyle: "preserve-3d" }}>
        <div ref={ringRef} className="relative">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute left-0 top-0"
              style={{ transform: `rotate(${p.angle}deg)` }}
            >
              <div
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                className="absolute left-0 top-0 rounded-full bg-ink opacity-[0.12]"
                style={{
                  width: p.size,
                  height: p.size,
                  // `calc(-1 * RADIUS)` rather than a bare `-RADIUS` — CSS
                  // doesn't allow negating a function (clamp()) with a
                  // leading minus sign outside of calc().
                  transform: `translate(-50%, -50%) translateY(calc(-1 * ${RADIUS})) scale(var(--dot-scale, 0.7))`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
