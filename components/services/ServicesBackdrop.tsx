"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

interface ServicesBackdropProps {
  /** Index (0-based) of whichever cluster is currently "active" per
   *  Services.tsx's own scroll tracking — tints the ambient glow to that
   *  cluster's accent so the atmosphere quietly tracks the content instead
   *  of sitting static behind it. */
  activeIndex: number;
  accents: string[];
}

const GRID_TILE = 64; // px — must match backgroundSize below exactly

/**
 * Ambient backdrop for the dark Services section: a very faint drifting
 * grid (a quiet nod to the technical/coordinate motifs used elsewhere) plus
 * a soft, blurred glow that follows the cursor on desktop and drifts on its
 * own on touch devices. Deliberately plain CSS/GSAP rather than a canvas or
 * three.js scene — the brief for this section is "less spectacle, more
 * confidence," and the Projects gallery right above it already spent the
 * WebGL budget.
 *
 * Absolutely positioned (not fixed) inside Services.tsx's own `relative`
 * section wrapper, so it simply scrolls with the section's normal document
 * flow like everything else in the page — no sticky/pin trickery needed to
 * keep it out of Projects' or the Footer's way.
 */
export default function ServicesBackdrop({ activeIndex, accents }: ServicesBackdropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
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
      // Slow drifting grid — a transform loop on an oversized tile (see
      // -inset-16 below), not a backgroundPosition animation, so it stays
      // compositor-cheap. Skipped under reduced motion.
      if (!reducedMotion && gridRef.current) {
        gsap.to(gridRef.current, {
          x: -GRID_TILE,
          y: -GRID_TILE,
          duration: 40,
          ease: "none",
          repeat: -1,
        });
      }

      const setGlowX = gsap.quickTo(glowWrapper, "x", { duration: 0.9, ease: "power3.out" });
      const setGlowY = gsap.quickTo(glowWrapper, "y", { duration: 0.9, ease: "power3.out" });

      if (isTouch || reducedMotion) {
        // No pointer to react to (or motion is dimmed): rest the glow at
        // the vertical center of whatever part of the (very tall) section
        // happens to be onscreen right now, in the container's own local
        // coordinate space (container-local y = viewport y - rect.top).
        const rect = container.getBoundingClientRect();
        setGlowX(window.innerWidth / 2 - rect.left);
        setGlowY(window.innerHeight / 2 - rect.top);

        if (!reducedMotion) {
          // Gentle autonomous drift so the section still feels alive on
          // touch devices, without any cursor dependency.
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

  // Crossfades the four accent-tinted glow layers as the active cluster
  // changes — cheap (four opacity tweens, only on the rare change) rather
  // than trying to tween the radial-gradient color strings directly.
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
      {/* Faint drifting technical grid, fading toward the section's edges. */}
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
            backgroundImage:
              "linear-gradient(rgba(245,243,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,238,0.06) 1px, transparent 1px)",
            backgroundSize: `${GRID_TILE}px ${GRID_TILE}px`,
          }}
        />
      </div>

      {/* Cursor-reactive (or, on touch, self-drifting) glow, tinted to the
          active cluster's accent. */}
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

      {/* Vignette to keep the far edges of the section reading as darkest. */}
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
