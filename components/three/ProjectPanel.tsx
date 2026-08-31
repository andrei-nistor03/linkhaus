"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { setCursorOverride } from "@/lib/cursorState";
import { createPanelMaterial } from "./PanelMaterial";
import {
  panelLayout,
  PANEL_WIDTH,
  PANEL_HEIGHT,
  PANEL_DEPTH,
  PANEL_COUNT,
  FOCUS_WINDOW,
} from "@/lib/galleryLayout";
import type { Project } from "@/components/projects/projectsData";

interface ProjectPanelProps {
  project: Project;
  index: number;
  reducedMotion: boolean;
}

const MAX_TILT = 0.16;

export default function ProjectPanel({ project, index, reducedMotion }: ProjectPanelProps) {
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
  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    galleryState.hoveredIndex = index;
    setCursorOverride("project");
    setEmphasized(true);
  };
  const onPointerOut = () => {
    if (galleryState.hoveredIndex === index) galleryState.hoveredIndex = -1;
    tiltTarget.current = { x: 0, y: 0 };
    setCursorOverride(null);
    setEmphasized(false);
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
