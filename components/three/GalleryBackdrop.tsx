"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_PAPER } from "@/lib/galleryLayout";

export default function GalleryBackdrop() {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    scene.background = new THREE.Color(SCENE_PAPER);
    scene.fog = new THREE.Fog(SCENE_PAPER, 5, 30);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  return null;
}
