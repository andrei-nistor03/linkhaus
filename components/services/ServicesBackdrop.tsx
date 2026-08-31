"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";
import { GRID_LINE_COLOR, GRID_MAJOR_COLOR, GRID_MAJOR_RATIO, hexToRgba } from "@/lib/gridTheme";

interface ServicesBackdropProps {
  /** Index (0-based) of whichever cluster is currently "active" per
   *  Services.tsx's own scroll tracking — tints the ambient glow to that
   *  cluster's accent so the atmosphere quietly tracks the content instead
   *  of sitting static behind it. */
  activeIndex: number;
  accents: string[];
}

const GRID_TILE = 64; // px — minor line spacing; must match backgroundSize below exactly
// Every GRID_MAJOR_RATIO-th line reads as a heavier "section" line, the same
// two-tier rhythm (and the same GRID_LINE_COLOR/GRID_MAJOR_COLOR palette) as
// the gallery floor grid in GalleryEnvironment.tsx — see gridTheme.ts for why
// this is the "rhyme, not a shared object" version of continuing that motif
// across the WebGL/CSS boundary.
const GRID_MAJOR_TILE = GRID_TILE * GRID_MAJOR_RATIO;
const GRID_MINOR_DIM = hexToRgba(GRID_LINE_COLOR, 0.055);
const GRID_MAJOR_DIM = hexToRgba(GRID_MAJOR_COLOR, 0.1);
const GRID_MINOR_LIT = hexToRgba(GRID_LINE_COLOR, 0.22);
const GRID_MAJOR_LIT = hexToRgba(GRID_MAJOR_COLOR, 0.32);

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

      // Idle "lighting" pass over the grid: a brighter copy of the same
      // grid lines, nested inside gridRef (so it drifts in lockstep and
      // its tiles never fall out of registration with the base layer),
      // revealed only through a soft ellipse mask whose center roams
      // briskly across nearly the full grid via CSS custom properties.
      // Only the mask's window moves — the bright layer's own
      // background-image never gets an independent transform — so no
      // matter where the spotlight roams, the lines it lights up are
      // pixel-aligned with the dim grid underneath. Two independent,
      // differently-timed yoyo tweens (rather than one circular path) keep
      // the wander from reading as a mechanical loop.
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
            // Major lines listed first so they paint on top of the minor
            // lines at their shared intersections, same layering order as
            // the sizes below.
            backgroundImage: [
              `linear-gradient(${GRID_MAJOR_DIM} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${GRID_MAJOR_DIM} 1px, transparent 1px)`,
              `linear-gradient(${GRID_MINOR_DIM} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${GRID_MINOR_DIM} 1px, transparent 1px)`,
            ].join(", "),
            backgroundSize: `${GRID_MAJOR_TILE}px ${GRID_MAJOR_TILE}px, ${GRID_MAJOR_TILE}px ${GRID_MAJOR_TILE}px, ${GRID_TILE}px ${GRID_TILE}px, ${GRID_TILE}px ${GRID_TILE}px`,
          }}
        >
          {/* Brighter twin of the grid above, nested here so it shares this
              element's drift transform exactly — see the tween comment for
              why only its mask (not this background) ever moves on its
              own. */}
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
