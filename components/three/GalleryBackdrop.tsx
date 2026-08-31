"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { SCENE_PAPER, SCENE_DARK, ENTRY_FADE_FRACTION } from "@/lib/galleryLayout";

function smoothstep(t: number) {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

export default function GalleryBackdrop() {
  const scene = useThree((state) => state.scene);
  const paper = useMemo(() => new THREE.Color(SCENE_PAPER), []);
  const dark = useMemo(() => new THREE.Color(SCENE_DARK), []);
  const current = useRef(new THREE.Color(SCENE_PAPER));

  useEffect(() => {
    scene.background = current.current;
    scene.fog = new THREE.Fog(SCENE_PAPER, 5, 30);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    const t = smoothstep(galleryState.progress / ENTRY_FADE_FRACTION);
    current.current.lerpColors(paper, dark, t);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(current.current);
  });

  return null;
}
