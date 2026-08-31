"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { galleryState } from "@/lib/galleryState";
import { useReducedMotion } from "@/lib/useMediaQuery";
import SceneErrorBoundary from "@/components/three/SceneErrorBoundary";
import WaveLabel from "@/components/ui/WaveLabel";
import { PROJECTS } from "@/components/projects/projectsData";
import { ENTRY_FADE_FRACTION } from "@/lib/galleryLayout";

const GalleryScene = dynamic(() => import("@/components/three/GalleryScene"), {
  ssr: false,
  loading: () => null,
});

const COUNT = PROJECTS.length;
const LABEL_TEXT = "Selected Work";

const LABEL_COLOR_FROM = "rgba(13,13,13,0.8)";
const LABEL_COLOR_TO = "rgba(245,243,238,0.92)";
const RAIL_TRACK_FROM = "rgba(13,13,13,0.1)";
const RAIL_TRACK_TO = "rgba(245,243,238,0.18)";
const RAIL_FILL_FROM = "rgba(13,13,13,0.7)";
const RAIL_FILL_TO = "rgba(245,243,238,0.85)";

const TITLE_SCALE_START = 3.2;
const TITLE_SETTLE_FRACTION = 0.12;

export default function Projects() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const railTrackRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const indexLabelRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  const centerOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    registerGsap();

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
        const settle = reducedMotion ? 1 : settleRaw * settleRaw * (3 - 2 * settleRaw);
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
            <WaveLabel text={LABEL_TEXT} reducedMotion={reducedMotion} />
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
