"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import GalleryCameraRig from "./GalleryCameraRig";
import GalleryTrack from "./GalleryTrack";
import GalleryBackdrop from "./GalleryBackdrop";
import GalleryEnvironment from "./GalleryEnvironment";
import ProjectPanel from "./ProjectPanel";
import PanelGlow from "./PanelGlow";
import { PROJECTS } from "@/components/projects/projectsData";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

export default function GalleryScene() {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const heavy = !isTouch && !reduced;

  return (
    <Canvas
      dpr={[1, heavy ? 1.75 : 1]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
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
        <GalleryTrack>
          <GalleryEnvironment reducedMotion={reduced} />
          {PROJECTS.map((project, i) => (
            <PanelGlow key={`glow-${project.title}`} index={i} phase={i * 1.9} />
          ))}
          {PROJECTS.map((project, i) => (
            <ProjectPanel key={project.title} project={project} index={i} reducedMotion={reduced} />
          ))}
        </GalleryTrack>
      </Suspense>

      <GalleryCameraRig reducedMotion={reduced} />
    </Canvas>
  );
}
