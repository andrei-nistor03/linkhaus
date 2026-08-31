"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import ContactField from "./ContactField";
import ContactParticles from "./ContactParticles";
import ContactPointer from "./ContactPointer";
import { contactState } from "@/lib/contactState";
import { useIsTouch, useReducedMotion } from "@/lib/useMediaQuery";

const DESKTOP_PARTICLES = 140;
const TOUCH_PARTICLES = 45;

export default function ContactScene() {
  const isTouch = useIsTouch();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    contactState.isTouch = isTouch;
    contactState.reducedMotion = reducedMotion;
  }, [isTouch, reducedMotion]);

  const particleCount = isTouch ? TOUCH_PARTICLES : DESKTOP_PARTICLES;

  return (
    <Canvas
      dpr={[1, isTouch || reducedMotion ? 1 : 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      className="!absolute inset-0"
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 20 }}
    >
      <ContactField />
      {!reducedMotion && <ContactParticles count={particleCount} />}
      <ContactPointer />
    </Canvas>
  );
}
