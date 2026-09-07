"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { setCursorOverride } from "@/lib/cursorState";
import { useIsTouch } from "@/lib/useMediaQuery";
import { lenisState } from "@/lib/lenisState";
import { ScrollTrigger } from "@/lib/gsap";
import { createPanelMaterial } from "./PanelMaterial";
import {
  panelLayout,
  PANEL_WIDTH,
  PANEL_HEIGHT,
  PANEL_DEPTH,
  PANEL_COUNT,
  FOCUS_WINDOW,
  progressForIndex,
  GALLERY_SCROLL_TRIGGER_ID,
} from "@/lib/galleryLayout";
import type { Project } from "@/components/projects/projectsData";

interface ProjectPanelProps {
  project: Project;
  index: number;
  reducedMotion: boolean;
}

const MAX_TILT = 0.16;
// A touch that moves or lingers past these limits is a scroll/drag, not a
// tap — used to tell the two apart on mobile/tablet.
const TAP_MAX_MOVE_PX = 10;
const TAP_MAX_DURATION_MS = 500;

export default function ProjectPanel({ project, index, reducedMotion }: ProjectPanelProps) {
  const isTouch = useIsTouch();
  const layout = useMemo(() => panelLayout(index), [index]);
  const material = useMemo(
    () => createPanelMaterial(project.accent, index * 1.37 + 0.4),
    [project.accent, index],
  );
  useEffect(() => () => material.dispose(), [material]);

  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const captionTopRef = useRef<HTMLDivElement>(null);
  const captionBottomRef = useRef<HTMLDivElement>(null);

  const hover = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });
  const tiltTarget = useRef({ x: 0, y: 0 });
  const [emphasized, setEmphasized] = useState(false);
  const wasTouchActive = useRef(false);
  const pointerDownInfo = useRef<{ x: number; y: number; time: number } | null>(null);

  useFrame((state, rawDelta) => {
    const inner = innerRef.current;
    if (!inner) return;
    const delta = Math.min(rawDelta, 1 / 30);

    const dist = Math.abs(layout.position.x - galleryState.focusX);
    const focus = THREE.MathUtils.clamp(1 - dist / FOCUS_WINDOW, 0, 1);
    const focusSmooth = focus * focus * (3 - 2 * focus);

    if (outerRef.current) {
      outerRef.current.rotation.y = layout.rotationY * (1 - focusSmooth);
    }

    // Touch/tablet: a tap starts the effect (see onPointerUp below), and
    // scrolling the panel out of focus is what stops it again.
    if (isTouch) {
      const isActive = galleryState.hoveredIndex === index;
      if (isActive && focus <= 0) {
        galleryState.hoveredIndex = -1;
      }
      const stillActive = galleryState.hoveredIndex === index;
      if (stillActive !== wasTouchActive.current) {
        wasTouchActive.current = stillActive;
        setEmphasized(stillActive);
      }
    }

    const hoverTarget = !reducedMotion && galleryState.hoveredIndex === index ? 1 : 0;
    hover.current += (hoverTarget - hover.current) * Math.min(1, delta * 6);

    tilt.current.x += (tiltTarget.current.x * hover.current - tilt.current.x) * Math.min(1, delta * 6);
    tilt.current.y += (tiltTarget.current.y * hover.current - tilt.current.y) * Math.min(1, delta * 6);

    const scale = (0.85 + focusSmooth * 0.22) * (1 + hover.current * 0.07);
    inner.scale.setScalar(scale);
    inner.position.z = hover.current * 0.24;
    inner.rotation.y = tilt.current.y;
    inner.rotation.x = tilt.current.x;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uHover.value = hover.current;
    material.uniforms.uFocus.value = THREE.MathUtils.lerp(
      material.uniforms.uFocus.value,
      0.35 + focusSmooth * 0.65,
      Math.min(1, delta * 4),
    );

    const captionOpacity = 0.3 + focusSmooth * 0.6 + hover.current * 0.1;
    const lift = (1 - focusSmooth) * 6;
    if (captionTopRef.current) {
      captionTopRef.current.style.opacity = String(captionOpacity);
      captionTopRef.current.style.transform = `translateY(${lift}px)`;
    }
    if (captionBottomRef.current) {
      captionBottomRef.current.style.opacity = String(captionOpacity);
      captionBottomRef.current.style.transform = `translateY(${lift}px)`;
    }
  });

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (reducedMotion) return;
    const inner = innerRef.current;
    if (!inner) return;
    const local = inner.worldToLocal(e.point.clone());
    tiltTarget.current = {
      x: THREE.MathUtils.clamp(-local.y / (PANEL_HEIGHT / 2), -1, 1) * MAX_TILT,
      y: THREE.MathUtils.clamp(local.x / (PANEL_WIDTH / 2), -1, 1) * MAX_TILT,
    };
  };
  // Desktop uses real hover. Touch/tablet has no hover state: tapping a
  // panel instead scrolls it to center and starts the effect, which then
  // runs until the panel is scrolled out of focus (see useFrame above).
  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (isTouch) return;
    e.stopPropagation();
    galleryState.hoveredIndex = index;
    setCursorOverride("project");
    setEmphasized(true);
  };
  const onPointerOut = () => {
    if (isTouch) return;
    if (galleryState.hoveredIndex === index) galleryState.hoveredIndex = -1;
    tiltTarget.current = { x: 0, y: 0 };
    setCursorOverride(null);
    setEmphasized(false);
  };
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isTouch) return;
    pointerDownInfo.current = { x: e.clientX, y: e.clientY, time: performance.now() };
  };
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isTouch) return;
    const start = pointerDownInfo.current;
    pointerDownInfo.current = null;
    if (!start) return;

    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    const elapsed = performance.now() - start.time;
    if (moved > TAP_MAX_MOVE_PX || elapsed > TAP_MAX_DURATION_MS) return; // was a scroll/drag, not a tap
    e.stopPropagation();

    const trigger = ScrollTrigger.getById(GALLERY_SCROLL_TRIGGER_ID);
    if (trigger) {
      const targetScroll = trigger.start + progressForIndex(index) * (trigger.end - trigger.start);
      const lenis = lenisState.instance;
      if (lenis) {
        lenis.scrollTo(targetScroll, { immediate: reducedMotion });
      } else {
        window.scrollTo({ top: targetScroll, behavior: reducedMotion ? "auto" : "smooth" });
      }
    }
    galleryState.hoveredIndex = index;
  };
  const onPointerCancel = () => {
    pointerDownInfo.current = null;
  };

  return (
    <group ref={outerRef} position={[layout.position.x, layout.position.y, layout.position.z]}>
      <group ref={innerRef}>
        <RoundedBox
          ref={meshRef}
          args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]}
          radius={0.045}
          smoothness={4}
          onPointerMove={onPointerMove}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <primitive object={material} attach="material" />
        </RoundedBox>
      </group>

      <Html
        center
        distanceFactor={4.6}
        position={[0, PANEL_HEIGHT / 2 + 0.32, PANEL_DEPTH / 2]}
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={captionTopRef}
          className="font-mono-label whitespace-nowrap rounded-full bg-paper/70 px-3 py-1 text-xs text-ink/70 backdrop-blur-sm"
        >
          Project {project.index} / {String(PANEL_COUNT).padStart(2, "0")}
        </div>
      </Html>

      <Html
        center
        distanceFactor={4.6}
        position={[0, -PANEL_HEIGHT / 2 - 0.26, PANEL_DEPTH / 2]}
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={captionBottomRef}
          className={`flex flex-col items-center whitespace-nowrap rounded-2xl bg-paper/75 px-5 py-3 text-center backdrop-blur-sm transition-transform duration-300 ${emphasized ? "scale-[1.04]" : ""}`}
        >
          <span
            className="font-display font-black uppercase leading-none tracking-wider text-ink [font-variation-settings:'wght'_800,'CNTR'_0] text-2xl"
          >
            {project.title}
          </span>
          <span className="font-mono-label text-[11px] text-muted">
            {project.tags.join(" / ")} — {project.year}
          </span>
        </div>
      </Html>
    </group>
  );
}
