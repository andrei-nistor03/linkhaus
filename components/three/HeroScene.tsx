"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import WallsModel from "./WallsModel";
import PulsatingLight from "./PulsatingLight";
import CameraRig from "./CameraRig";
import PointerTracker from "./PointerTracker";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

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

      <ambientLight intensity={0.15} />
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

      <Suspense fallback={null}>
        <WallsModel scale={1.3} position={[0, -0.05, 0]} rotation={[0.04, -0.55, 0.01]} />
        {heavy && (
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
