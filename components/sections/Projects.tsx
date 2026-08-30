"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { galleryState } from "@/lib/galleryState";
import { useReducedMotion } from "@/lib/useMediaQuery";
import SceneErrorBoundary from "@/components/three/SceneErrorBoundary";
import { PROJECTS } from "@/components/projects/projectsData";
import { ENTRY_FADE_FRACTION } from "@/lib/galleryLayout";

const GalleryScene = dynamic(() => import("@/components/three/GalleryScene"), {
  ssr: false,
  loading: () => null,
});

const COUNT = PROJECTS.length;
const LABEL_TEXT = "Selected Work";

// HUD chrome opens on the hero's ink-on-paper palette and crossfades to
// paper-on-dark over the same ENTRY_FADE_FRACTION of scroll GalleryBackdrop
// uses for the WebGL scene's own background/fog — see that file. Kept as
// rgba strings (rather than the hex SCENE_PAPER/SCENE_DARK constants) so
// gsap.utils.interpolate can cross-fade alpha alongside hue in one call.
const LABEL_COLOR_FROM = "rgba(13,13,13,0.8)";
const LABEL_COLOR_TO = "rgba(245,243,238,0.92)";
const RAIL_TRACK_FROM = "rgba(13,13,13,0.1)";
const RAIL_TRACK_TO = "rgba(245,243,238,0.18)";
const RAIL_FILL_FROM = "rgba(13,13,13,0.7)";
const RAIL_FILL_TO = "rgba(245,243,238,0.85)";

// The "Selected Work" label opens as a big, dead-center title — its own
// small hero moment — then scales/slides down into its final small HUD
// corner as the section settles in, over the first TITLE_SETTLE_FRACTION of
// scroll. Starting that journey at progress 0 (the instant the pin
// engages, same moment panel 0 starts sliding in from the right) is what
// makes it read as "visible sooner" rather than something you have to
// scroll partway in to discover.
const TITLE_SCALE_START = 3.2;
const TITLE_SETTLE_FRACTION = 0.12;

/**
 * The 3D exhibition that follows the hero: a single pinned section whose
 * vertical scroll (via GSAP ScrollTrigger, same scrub-a-timeline pattern as
 * Hero.tsx) drives galleryState.progress, which GalleryCameraRig then reads
 * every three.js frame to dolly through the corridor of ProjectPanel meshes.
 * All the actual 3D — camera, panels, environment — lives under
 * GalleryScene; this component only owns the pin/scrub wiring and the HUD
 * chrome (section label, progress rail, index counter) that sits above the
 * canvas.
 */
export default function Projects() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const railTrackRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const indexLabelRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  // One span per character (space included, so the wave animation's
  // staggered delay flows continuously across both words) — the idle
  // ripple below animates these directly, the same "every letter is its
  // own node" approach Hero.tsx uses for its title, but with a distinct
  // motion: a continuous sine wave via CSS animation-delay, rather than
  // Hero's JS-driven "stretch one random letter, spring back" cascade.
  const labelChars = useMemo(() => LABEL_TEXT.split(""), []);
  // Viewport-center minus the label's own natural (untransformed) center,
  // in px — the translate distance its zoom-in entrance animates out of.
  // Measured (not hardcoded) the same way FitWidthLines.tsx measures the
  // hero title, so it stays correct across breakpoints/font-size clamps
  // instead of guessing pixel offsets for a responsive layout.
  const centerOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    registerGsap();

    function measureLabelCenterOffset() {
      const label = labelRef.current;
      const pin = pinRef.current;
      if (!label || !pin) return;
      // Measured relative to `pin`, not the viewport — at mount (or any
      // time before the section has actually scrolled into its pinned
      // position) `pin` itself can be sitting thousands of px down the
      // document, and a viewport-relative reading here would come out
      // wildly wrong. `pin` is always exactly viewport-sized (`h-screen
      // w-full`) whether or not it's currently pinned, so its position
      // once pinned is always (0, 0) — meaning the label's offset *within
      // pin* IS its eventual viewport position, regardless of when this
      // runs.
      const prevTransform = label.style.transform;
      label.style.transform = "none";
      const labelRect = label.getBoundingClientRect();
      const pinRect = pin.getBoundingClientRect();
      label.style.transform = prevTransform;
      const labelCenterXInPin = labelRect.left - pinRect.left + labelRect.width / 2;
      const labelCenterYInPin = labelRect.top - pinRect.top + labelRect.height / 2;
      centerOffset.current = {
        x: window.innerWidth / 2 - labelCenterXInPin,
        y: window.innerHeight / 2 - labelCenterYInPin,
      };
    }
    measureLabelCenterOffset();
    window.addEventListener("resize", measureLabelCenterOffset);

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          // Keep this in step with the wrapper's own h-[600vh] below: with
          // the pinned child at h-screen, plain CSS `sticky` would release
          // after (600 - 100)vh = 500vh of scroll on its own, so the pin
          // duration here is set to match — otherwise the two disagree and
          // the section either releases early (content still sliding) or
          // leaves leftover blank scroll after release. 500% also matches
          // galleryLayout.ts's TRACK_LENGTH, which is sized so progress 1
          // lands exactly when the last panel is centered — no empty
          // corridor to scroll through after it.
          end: "+=500%",
          scrub: 1.3,
          pin: pinRef.current,
          pinSpacing: true,
          onUpdate: (self) => {
            galleryState.progress = self.progress;
            galleryState.velocity = gsap.utils.clamp(-1, 1, self.getVelocity() / 2500);
          },
        },
      });
    }, wrapperRef);

    // Rail fill, index counter and the HUD's ink->paper crossfade are all
    // driven straight off galleryState on GSAP's own ticker rather than
    // React state — this reruns up to 60x/sec while scrolling, and
    // scrollState.ts's reasoning applies equally here: a React re-render
    // per tick would be wasted work for a handful of direct DOM writes.
    const onTick = () => {
      const p = galleryState.progress;
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleX(${p})`;
      }
      const idx = Math.min(COUNT - 1, Math.max(0, Math.round(p * (COUNT - 1))));
      const label = `${String(idx + 1).padStart(2, "0")} / ${String(COUNT).padStart(2, "0")}`;
      if (indexLabelRef.current && indexLabelRef.current.textContent !== label) {
        indexLabelRef.current.textContent = label;
      }

      const fade = gsap.utils.clamp(0, 1, p / ENTRY_FADE_FRACTION);
      if (labelRef.current) labelRef.current.style.color = gsap.utils.interpolate(LABEL_COLOR_FROM, LABEL_COLOR_TO, fade);
      if (indexLabelRef.current) indexLabelRef.current.style.color = gsap.utils.interpolate(LABEL_COLOR_FROM, LABEL_COLOR_TO, fade);
      if (railTrackRef.current) railTrackRef.current.style.backgroundColor = gsap.utils.interpolate(RAIL_TRACK_FROM, RAIL_TRACK_TO, fade);
      if (railFillRef.current) railFillRef.current.style.backgroundColor = gsap.utils.interpolate(RAIL_FILL_FROM, RAIL_FILL_TO, fade);

      if (labelRef.current) {
        const settleRaw = gsap.utils.clamp(0, 1, p / TITLE_SETTLE_FRACTION);
        const settle = reducedMotion ? 1 : settleRaw * settleRaw * (3 - 2 * settleRaw); // smoothstep
        const scale = gsap.utils.interpolate(TITLE_SCALE_START, 1, settle);
        const tx = gsap.utils.interpolate(centerOffset.current.x, 0, settle);
        const ty = gsap.utils.interpolate(centerOffset.current.y, 0, settle);
        labelRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      }
    };
    gsap.ticker.add(onTick);

    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("resize", measureLabelCenterOffset);
      ctx.revert();
      galleryState.progress = 0;
      galleryState.velocity = 0;
      galleryState.hoveredIndex = -1;
    };
  }, [reducedMotion]);

  return (
    <section id="work" ref={wrapperRef} className="relative h-[600vh]">
      <div ref={pinRef} className="sticky top-0 h-screen w-full overflow-hidden bg-paper">
        <SceneErrorBoundary fallback={<div className="absolute inset-0 bg-paper" />}>
          <GalleryScene />
        </SceneErrorBoundary>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5 sm:p-8">
          <h2
            ref={labelRef}
            className="font-display font-black uppercase leading-[0.85] tracking-wide [font-variation-settings:'wght'_900,'CNTR'_0] text-[clamp(1.9rem,4.4vw,3.75rem)]"
            style={{ color: LABEL_COLOR_FROM, willChange: "transform" }}
          >
            {labelChars.map((char, i) =>
              char === " " ? (
                <span key={i} className="inline-block">
                  &nbsp;
                </span>
              ) : (
                <span
                  key={i}
                  className={reducedMotion ? "inline-block" : "label-wave-letter"}
                  style={reducedMotion ? undefined : { animationDelay: `${i * 0.07}s` }}
                >
                  {char}
                </span>
              ),
            )}
          </h2>
          <span
            ref={indexLabelRef}
            className="font-mono-label pt-2 text-xs"
            style={{ color: LABEL_COLOR_FROM }}
          >
            01 / {String(COUNT).padStart(2, "0")}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-7 sm:px-8">
          <div ref={railTrackRef} className="relative h-px w-full" style={{ backgroundColor: RAIL_TRACK_FROM }}>
            <div
              ref={railFillRef}
              className="absolute inset-y-0 left-0 h-px w-full origin-left"
              style={{ transform: "scaleX(0)", backgroundColor: RAIL_FILL_FROM }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
