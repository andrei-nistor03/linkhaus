"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import WallsModel from "./WallsModel";
import PulsatingLight from "./PulsatingLight";
import CameraRig from "./CameraRig";
import PointerTracker from "./PointerTracker";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

/**
 * The hero's 3D layer: the LINKHAUS mark centered in frame with a quiet
 * violet light behind it, and a scroll-driven camera dolly. Rendered with a
 * transparent clear so the halftone canvas behind it shows through.
 *
 * No `@react-three/postprocessing` here on purpose: EffectComposer's merged
 * shader doesn't reliably carry the scene's alpha channel through to the
 * final pass, so with *any* effect attached (Bloom alone was enough to
 * reproduce it) this canvas stopped being transparent almost everywhere,
 * silently hiding the halftone layer drawn behind it. Revisit only with a
 * config that's been verified not to regress that transparency.
 */
export default function HeroScene() {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const heavy = !isTouch && !reduced;

  return (
    <Canvas
      dpr={[1, heavy ? 1.75 : 1]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      shadows={heavy}
      className="!absolute inset-0"
    >
      <PerspectiveCamera makeDefault fov={35} position={[0, 0, 6]} near={0.1} far={20} />
      <fog attach="fog" args={["#f5f3ee", 3.6, 9]} />

      {/* Ambient kept very low on purpose: it's the one light in the rig
          that can't cast a shadow, so turning it up washes out whatever the
          key light's shadow map draws and the model goes back to reading
          flat. Just enough here to keep the unlit side readable rather than
          crushed to pure black. */}
      <ambientLight intensity={0.15} />
      {/* The single, one-sided key light — everything else that used to
          light this model (a frontal fill pointLight and a directional rim
          light from the opposite side) has been removed on purpose: with
          light hitting from only one direction, the model's own geometry
          casts real shadows across itself instead of every face getting
          filled in from some direction, which read as flat and overlit.
          Raised and tightened to actually draw a visible, crisp shadow
          instead of relying on three's defaults, which frame a much larger
          area than this model needs and land as a blurry 512px shadow map
          spread across it. Bounding the shadow camera to roughly the
          model's own footprint and doubling the map resolution is what
          makes the notch/corner read as carved rather than painted on. */}
      <directionalLight
        position={[2.5, 3.5, 4]}
        intensity={1.1}
        castShadow={heavy}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-camera-near={0.1}
        shadow-camera-far={9}
        shadow-bias={-0.0015}
        shadow-normalBias={0.02}
      />
      <PulsatingLight />
      {/* The panel-shaped purple glow plane lives inside WallsModel
          (WallGlowBacking), locked to each panel's own transform. Each panel
          also carries its own pulsing point light parked at the panel's
          opening/notch, so light actually shines through the gap in the
          wall geometry instead of just the flat unlit texture implying it. */}

      <Suspense fallback={null}>
        <WallsModel scale={1.3} position={[0, -0.05, 0]} rotation={[0.04, -0.55, 0.01]} />
        {heavy && (
          // Lightformer intensities trimmed down from their original values
          // (2.2 / 0.9 / 0.5) — this environment wraps the whole scene, so
          // at full strength it acted as ambient fill from every direction
          // at once and fought the single-sided key light above. Kept
          // around only for subtle reflections/highlights now, not as a
          // real light source.
          <Environment resolution={128} frames={1}>
            <Lightformer intensity={0.8} color="#ffffff" position={[0, 3, 1]} scale={[8, 2, 1]} />
            <Lightformer intensity={0.35} color="#8a5cff" position={[-3, -1, -2]} scale={4} />
            <Lightformer intensity={0.2} color="#2b4bff" position={[3, 1, -1]} scale={3} />
          </Environment>
        )}
      </Suspense>

      <CameraRig />
      <PointerTracker />
    </Canvas>
  );
}
