"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { contactState } from "@/lib/contactState";
import { createContactFieldMaterial } from "./ContactFieldMaterial";

const PEAK_AT = 0.35;
const CALM_FROM = 0.55;
const CALM_FLOOR = 0.45;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function ContactField() {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => createContactFieldMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);
  const size = useThree((s) => s.size);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (mesh) {
      const vp = state.viewport;
      mesh.scale.set(vp.width, vp.height, 1);
    }

    const reduced = contactState.reducedMotion ? 1 : 0;
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uAspect.value = size.width / size.height;
    u.uReduced.value = reduced;
    u.uPointer.value.set(contactState.pointerEased.x, contactState.pointerEased.y);
    u.uHover.value = contactState.hoverBoost;

    const p = contactState.progress;
    const rise = smoothstep(0, PEAK_AT, p);
    const fall = 1 - smoothstep(CALM_FROM, 1, p) * (1 - CALM_FLOOR);
    u.uIntensity.value = rise * fall;
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
