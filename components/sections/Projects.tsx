"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { galleryState } from "@/lib/galleryState";
import { useMediaQuery, useReducedMotion } from "@/lib/useMediaQuery";
import { usePauseOffscreen } from "@/lib/usePauseOffscreen";
import SceneErrorBoundary from "@/components/three/SceneErrorBoundary";
import WaveLabel from "@/components/ui/WaveLabel";
import { PROJECT_META, localizeProjects } from "@/components/projects/projectsData";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { toDisplayGlyphs } from "@/lib/i18n/displayGlyphs";
import {
  ENTRY_FADE_FRACTION,
  GALLERY_SCROLL_TRIGGER_ID,
  VERTICAL_QUERY,
  galleryMetrics,
} from "@/lib/galleryLayout";

const GalleryScene = dynamic(() => import("@/components/three/GalleryScene"), {
  ssr: false,
  loading: () => null,
});

const COUNT = PROJECT_META.length;

const LABEL_COLOR_FROM = "rgba(13,13,13,0.8)";
const LABEL_COLOR_TO = "rgba(245,243,238,0.92)";
const RAIL_TRACK_FROM = "rgba(13,13,13,0.1)";
const RAIL_TRACK_TO = "rgba(245,243,238,0.18)";
const RAIL_FILL_FROM = "rgba(13,13,13,0.7)";
const RAIL_FILL_TO = "rgba(245,243,238,0.85)";

const TITLE_SCALE_START = 3.2;
const TITLE_SETTLE_FRACTION = 0.12;
// Minimum breathing room kept on each side of the viewport so the huge
// starting scale never crops the label off-screen on narrow devices.
const TITLE_VIEWPORT_MARGIN = 20;
// Same breakpoint the scene uses to switch the gallery from a horizontal
// rail to a vertical stack, so the label and the layout flip together.
const MOBILE_QUERY = VERTICAL_QUERY;

// Scroll distance the pinned section consumes, as a percentage of the
// viewport height. It's derived from the track length, so adding or
// removing a project keeps the same travel-per-pixel feel, and the
// vertical stack (panels spaced on their short edge, so a shorter track)
// gets proportionally less scroll than the horizontal rail.
const SCROLL_VH_PER_UNIT = 20.5;
const scrollDistanceFor = (vertical: boolean) =>
  Math.round((SCROLL_VH_PER_UNIT * galleryMetrics(vertical).trackLength) / 10) * 10;
const SCROLL_DISTANCE = scrollDistanceFor(false);
const MOBILE_SCROLL_DISTANCE = scrollDistanceFor(true);
// On mobile the label settles centered under the navbar instead of its
// desktop corner spot; this is the gap kept between the two.
const MOBILE_LABEL_TOP_GAP = 18;

export default function Projects() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const railTrackRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const indexLabelRef = useRef<HTMLSpanElement>(null);
  const topScrimRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { dict } = useI18n();
  const projects = useMemo(() => localizeProjects(dict.projects.items), [dict]);
  usePauseOffscreen(wrapperRef);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const scrollDistance = isMobile ? MOBILE_SCROLL_DISTANCE : SCROLL_DISTANCE;

  const centerOffset = useRef({ x: 0, y: 0 });
  const settleOffset = useRef({ x: 0, y: 0 });
  const scaleStart = useRef(TITLE_SCALE_START);
  // Label's own layout metrics, relative to the pin container — stable
  // regardless of scroll/pin state, only needs recomputing on resize.
  const labelMetrics = useRef({ centerXInPin: 0, centerYInPin: 0, height: 0 });
  const navElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    registerGsap();
    navElRef.current = document.querySelector("nav");

    function measureLabelCenterOffset() {
      const label = labelRef.current;
      const pin = pinRef.current;
      if (!label || !pin) return;
      const prevTransform = label.style.transform;
      label.style.transform = "none";
      const labelRect = label.getBoundingClientRect();
      const pinRect = pin.getBoundingClientRect();
      label.style.transform = prevTransform;
      const labelCenterXInPin = labelRect.left - pinRect.left + labelRect.width / 2;
      const labelCenterYInPin = labelRect.top - pinRect.top + labelRect.height / 2;
      labelMetrics.current = {
        centerXInPin: labelCenterXInPin,
        centerYInPin: labelCenterYInPin,
        height: labelRect.height,
      };
      centerOffset.current = {
        x: window.innerWidth / 2 - labelCenterXInPin,
        y: window.innerHeight / 2 - labelCenterYInPin,
      };

      // Cap the zoomed-in start scale so the label always fits inside the
      // viewport width on narrow screens instead of cropping off-screen.
      const safeWidth = window.innerWidth - TITLE_VIEWPORT_MARGIN * 2;
      const maxScale = labelRect.width > 0 ? safeWidth / labelRect.width : TITLE_SCALE_START;
      scaleStart.current = Math.max(1, Math.min(TITLE_SCALE_START, maxScale));

      // Desktop settles into its natural (corner) flow position, i.e. no
      // offset. Mobile's target (centered under the navbar) depends on the
      // navbar's live position/height, which changes as it scrolls into
      // its "pill" state — that part is recomputed every frame in onTick.
      settleOffset.current.x = isMobile ? window.innerWidth / 2 - labelCenterXInPin : 0;
      if (!isMobile) settleOffset.current.y = 0;
    }
    measureLabelCenterOffset();
    window.addEventListener("resize", measureLabelCenterOffset);

    // onTick below only needs to run while the section is on screen.
    let inView = false;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          inView = self.isActive;
        },
      });
      gsap.timeline({
        scrollTrigger: {
          id: GALLERY_SCROLL_TRIGGER_ID,
          trigger: wrapperRef.current,
          start: "top top",
          // CSS sticky does the pinning (see Hero.tsx); the range is exactly
          // how long the panel stays stuck.
          end: () =>
            `+=${Math.max(1, wrapperRef.current!.offsetHeight - pinRef.current!.offsetHeight)}`,
          invalidateOnRefresh: true,
          scrub: 1.3,
          onUpdate: (self) => {
            galleryState.progress = self.progress;
            galleryState.velocity = gsap.utils.clamp(-1, 1, self.getVelocity() / 2500);
          },
        },
      });
    }, wrapperRef);
    // Every trigger further down the page (Services, the Contact veil, ...)
    // depends on this section's height, so re-measure them all whenever the
    // layout mode flips.
    ScrollTrigger.refresh();

    const onTick = () => {
      if (!inView) return;
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
      // The vertical stack scrolls panels up through the header, so the scrim
      // fades in with the dark scene to keep the label readable over them.
      if (topScrimRef.current) topScrimRef.current.style.opacity = String(fade);

      if (isMobile && navElRef.current) {
        const navBottom = navElRef.current.getBoundingClientRect().bottom;
        const targetCenterY = navBottom + MOBILE_LABEL_TOP_GAP + labelMetrics.current.height / 2;
        settleOffset.current.y = targetCenterY - labelMetrics.current.centerYInPin;
      }

      if (labelRef.current) {
        const settleRaw = gsap.utils.clamp(0, 1, p / TITLE_SETTLE_FRACTION);
        const settle = reducedMotion ? 1 : settleRaw * settleRaw * (3 - 2 * settleRaw);
        const scale = gsap.utils.interpolate(scaleStart.current, 1, settle);
        const tx = gsap.utils.interpolate(centerOffset.current.x, settleOffset.current.x, settle);
        const ty = gsap.utils.interpolate(centerOffset.current.y, settleOffset.current.y, settle);
        labelRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      }
    };
    gsap.ticker.add(onTick);

    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("resize", measureLabelCenterOffset);
      ctx.revert();
      galleryState.progress = 0;
      galleryState.nearestIndex = 0;
      galleryState.velocity = 0;
      galleryState.hoveredIndex = -1;
    };
  }, [reducedMotion, isMobile, scrollDistance]);

  return (
    <section
      id="work"
      ref={wrapperRef}
      // Height comes from CSS (the sm breakpoint matches VERTICAL_QUERY), so
      // it's right from the first paint. Set from JS it rendered at the
      // desktop height on phones until hydration finished, which pushed
      // every ScrollTrigger below it (e.g. the Contact veil) out of place.
      className="relative h-[var(--h-mobile)] sm:h-[var(--h-desktop)]"
      style={
        {
          "--h-mobile": `${MOBILE_SCROLL_DISTANCE + 100}vh`,
          "--h-desktop": `${SCROLL_DISTANCE + 100}vh`,
        } as React.CSSProperties
      }
    >
      <div ref={pinRef} className="sticky top-0 h-screen w-full overflow-hidden bg-paper">
        <SceneErrorBoundary fallback={<div className="absolute inset-0 bg-paper" />}>
          <GalleryScene />
        </SceneErrorBoundary>

        {isMobile && (
          <div
            ref={topScrimRef}
            className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-44 bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d]/70 to-transparent"
            style={{ opacity: 0 }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5 sm:p-8">
          <h2
            ref={labelRef}
            className="font-display font-black uppercase leading-[0.85] tracking-wide [font-variation-settings:'wght'_900,'CNTR'_0] text-[clamp(1.9rem,4.4vw,3.75rem)]"
            style={{ color: LABEL_COLOR_FROM, willChange: "transform" }}
          >
            <WaveLabel text={toDisplayGlyphs(dict.projects.label)} reducedMotion={reducedMotion} />
          </h2>
          <span
            ref={indexLabelRef}
            className="font-mono-label pt-2 text-xs"
            style={{ color: LABEL_COLOR_FROM }}
          >
            01 / {String(COUNT).padStart(2, "0")}
          </span>
        </div>

        {/* The gallery is drawn in WebGL, so crawlers and screen readers get
            the same project list as plain, visually hidden HTML. */}
        <ul className="sr-only">
          {projects.map((project) => (
            <li key={project.title}>
              {project.title} — {project.tags.join(", ")}, {project.year}. {project.description}
            </li>
          ))}
        </ul>

        {/* The horizontal progress rail only matches the desktop rail layout;
            under the dark vertical stack it just reads as a stray white line,
            so mobile relies on the index counter alone. */}
        {!isMobile && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-7 sm:px-8">
            <div ref={railTrackRef} className="relative h-px w-full" style={{ backgroundColor: RAIL_TRACK_FROM }}>
              <div
                ref={railFillRef}
                className="absolute inset-y-0 left-0 h-px w-full origin-left"
                style={{ transform: "scaleX(0)", backgroundColor: RAIL_FILL_FROM }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
