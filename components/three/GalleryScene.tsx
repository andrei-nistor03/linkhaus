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

/**
 * The 3D exhibition space Projects.tsx pins the page to. Opaque (unlike
 * HeroScene, which stays alpha-transparent so the halftone canvas behind it
 * shows through) — this section owns its own background, so it can run a
 * real fog/backdrop pass without HeroScene's postprocessing-vs-alpha
 * tradeoff applying here. GalleryBackdrop (not a plain `<color>`/`<fog>`
 * pair) owns that background/fog so it can animate paper -> dark as the
 * section comes into view — see that file.
 */
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

      {/*
        The camera barely moves now (see GalleryCameraRig) — it's the scene
        that travels past it (see GalleryTrack) — so this whole lighting
        rig, sized to just the near-camera viewing area rather than the
        full corridor, stays correctly aimed at whichever panels are
        actually in view at any scroll position, rather than being spread
        thin (or missed entirely) across a span the camera itself no longer
        sweeps through.
      */}
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
