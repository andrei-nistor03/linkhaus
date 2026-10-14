"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import GalleryCameraRig from "./GalleryCameraRig";
import GalleryTrack from "./GalleryTrack";
import GalleryBackdrop from "./GalleryBackdrop";
import GalleryEnvironment from "./GalleryEnvironment";
import ProjectPanel from "./ProjectPanel";
import PanelGlow from "./PanelGlow";
import { localizeProjects } from "@/components/projects/projectsData";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useIsTouch, useMediaQuery, useReducedMotion } from "@/lib/useMediaQuery";
import { galleryMetrics, VERTICAL_QUERY } from "@/lib/galleryLayout";
import { useInView } from "@/lib/useInView";

export default function GalleryScene() {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const vertical = useMediaQuery(VERTICAL_QUERY);
  const heavy = !isTouch && !reduced;
  const metrics = useMemo(() => galleryMetrics(vertical), [vertical]);
  const { dict } = useI18n();
  const projects = useMemo(() => localizeProjects(dict.projects.items), [dict]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(canvasRef);

  // The dust field rides along with the horizontal rail, but in the vertical
  // stack the track scrolls on the same axis the flakes rise on — so it's
  // parented outside the track and stays camera-locked instead.
  const environment = <GalleryEnvironment reducedMotion={reduced} vertical={vertical} lite={isTouch} />;

  return (
    <Canvas
      ref={canvasRef}
      frameloop={inView ? "always" : "demand"}
      dpr={[1, heavy ? 1.75 : 1]}
      gl={{ antialias: !isTouch, powerPreference: "high-performance" }}
      shadows={heavy}
      className="!absolute inset-0"
    >
      <GalleryBackdrop />
      <PerspectiveCamera makeDefault fov={32} position={[0, 0.18, 4.6]} near={0.1} far={24} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={0.9}
        castShadow={heavy}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.1}
        shadow-camera-far={16}
        shadow-bias={-0.0015}
      />
      <pointLight position={[0, 1.6, 2]} color="#8a5cff" intensity={0.25} distance={10} decay={2} />

      <Suspense fallback={null}>
        {vertical && environment}
        <GalleryTrack metrics={metrics}>
          {!vertical && environment}
          {projects.map((project, i) => (
            <PanelGlow key={`glow-${project.title}`} index={i} phase={i * 1.9} metrics={metrics} lite={isTouch} />
          ))}
          {projects.map((project, i) => (
            <ProjectPanel
              key={project.title}
              project={project}
              label={dict.projects.panelLabel}
              index={i}
              reducedMotion={reduced}
              metrics={metrics}
            />
          ))}
        </GalleryTrack>
      </Suspense>

      <GalleryCameraRig reducedMotion={reduced} vertical={vertical} />
    </Canvas>
  );
}
