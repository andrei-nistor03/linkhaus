"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { LoadingStage } from "@/lib/useLoadingProgress";

const PARTICLE_COUNT = 36;
const RADIUS = "clamp(56px, 8vw, 104px)";

interface LoadingVisualProps {
  progressRef: React.MutableRefObject<number>;
  stage: LoadingStage;
  exploding: boolean;
  reducedMotion: boolean;
  isTouch: boolean;
}

function hash(i: number, salt: number) {
  let h = (i * 374761393 + salt * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

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
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (360 / PARTICLE_COUNT) * i,
        size: 3 + hash(i, 1) * 3,
      })),
    [],
  );

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

  useEffect(() => {
    if (!exploding) return;
    const tl = gsap.timeline();
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
