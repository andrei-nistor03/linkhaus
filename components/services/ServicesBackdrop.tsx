"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";
import { GRID_LINE_COLOR, GRID_MAJOR_COLOR, GRID_MAJOR_RATIO, hexToRgba } from "@/lib/gridTheme";

interface ServicesBackdropProps {
  activeIndex: number;
  accents: string[];
}

const GRID_TILE = 64;
const GRID_MAJOR_TILE = GRID_TILE * GRID_MAJOR_RATIO;
const GRID_MINOR_DIM = hexToRgba(GRID_LINE_COLOR, 0.055);
const GRID_MAJOR_DIM = hexToRgba(GRID_MAJOR_COLOR, 0.1);
const GRID_MINOR_LIT = hexToRgba(GRID_LINE_COLOR, 0.22);
const GRID_MAJOR_LIT = hexToRgba(GRID_MAJOR_COLOR, 0.32);

export default function ServicesBackdrop({ activeIndex, accents }: ServicesBackdropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const gridLightRef = useRef<HTMLDivElement>(null);
  const glowWrapperRef = useRef<HTMLDivElement>(null);
  const glowLayerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isTouch = useIsTouch();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    registerGsap();
    const container = containerRef.current;
    const glowWrapper = glowWrapperRef.current;
    if (!container || !glowWrapper) return;

    let onMove: ((e: PointerEvent) => void) | undefined;

    const ctx = gsap.context(() => {
      if (!reducedMotion && gridRef.current) {
        gsap.to(gridRef.current, {
          x: -GRID_TILE,
          y: -GRID_TILE,
          duration: 40,
          ease: "none",
          repeat: -1,
        });
      }

      if (!reducedMotion && gridLightRef.current) {
        gsap.fromTo(
          gridLightRef.current,
          { "--gx": "14%" },
          { "--gx": "86%", duration: 10, ease: "sine.inOut", yoyo: true, repeat: -1 },
        );
        gsap.fromTo(
          gridLightRef.current,
          { "--gy": "18%" },
          { "--gy": "82%", duration: 7, ease: "sine.inOut", yoyo: true, repeat: -1 },
        );
      }

      const setGlowX = gsap.quickTo(glowWrapper, "x", { duration: 0.9, ease: "power3.out" });
      const setGlowY = gsap.quickTo(glowWrapper, "y", { duration: 0.9, ease: "power3.out" });

      if (isTouch || reducedMotion) {
        const rect = container.getBoundingClientRect();
        setGlowX(window.innerWidth / 2 - rect.left);
        setGlowY(window.innerHeight / 2 - rect.top);

        if (!reducedMotion) {
          gsap.to(glowWrapper, {
            x: `+=140`,
            y: `+=90`,
            duration: 16,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      } else {
        onMove = (e: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          setGlowX(e.clientX - rect.left);
          setGlowY(e.clientY - rect.top);
        };
        document.addEventListener("pointermove", onMove);
      }
    }, containerRef);

    return () => {
      if (onMove) document.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, [isTouch, reducedMotion]);

  useEffect(() => {
    glowLayerRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        opacity: i === activeIndex ? 1 : 0,
        duration: reducedMotion ? 0.01 : 1.4,
        ease: "power2.out",
      });
    });
  }, [activeIndex, reducedMotion]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 40%, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 40%, black, transparent 85%)",
        }}
      >
        <div
          ref={gridRef}
          className="absolute -inset-16"
          style={{
            backgroundImage: [
              `linear-gradient(${GRID_MAJOR_DIM} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${GRID_MAJOR_DIM} 1px, transparent 1px)`,
              `linear-gradient(${GRID_MINOR_DIM} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${GRID_MINOR_DIM} 1px, transparent 1px)`,
            ].join(", "),
            backgroundSize: `${GRID_MAJOR_TILE}px ${GRID_MAJOR_TILE}px, ${GRID_MAJOR_TILE}px ${GRID_MAJOR_TILE}px, ${GRID_TILE}px ${GRID_TILE}px, ${GRID_TILE}px ${GRID_TILE}px`,
          }}
        >
          {!reducedMotion && (
            <div
              ref={gridLightRef}
              className="absolute inset-0"
              style={
                {
                  "--gx": "50%",
                  "--gy": "50%",
                  backgroundImage: [
                    `linear-gradient(${GRID_MAJOR_LIT} 1px, transparent 1px)`,
                    `linear-gradient(90deg, ${GRID_MAJOR_LIT} 1px, transparent 1px)`,
                    `linear-gradient(${GRID_MINOR_LIT} 1px, transparent 1px)`,
                    `linear-gradient(90deg, ${GRID_MINOR_LIT} 1px, transparent 1px)`,
                  ].join(", "),
                  backgroundSize: `${GRID_MAJOR_TILE}px ${GRID_MAJOR_TILE}px, ${GRID_MAJOR_TILE}px ${GRID_MAJOR_TILE}px, ${GRID_TILE}px ${GRID_TILE}px, ${GRID_TILE}px ${GRID_TILE}px`,
                  maskImage:
                    "radial-gradient(ellipse 26% 22% at var(--gx) var(--gy), black, transparent 70%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 26% 22% at var(--gx) var(--gy), black, transparent 70%)",
                } as CSSProperties
              }
            />
          )}
        </div>
      </div>

      <div
        ref={glowWrapperRef}
        className="absolute left-0 top-0 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{ filter: "blur(70px)" }}
      >
        {accents.map((color, i) => (
          <div
            key={color}
            ref={(el) => {
              glowLayerRefs.current[i] = el;
            }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}33 0%, ${color}00 70%)`,
              opacity: i === activeIndex ? 1 : 0,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,243,238,0.05), transparent 60%)",
        }}
      />
    </div>
  );
}
