"use client";

import { useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";
import WallGlowBacking from "./WallGlowBacking";

const MODEL_PATH = "/models/linkhaus_walls.glb";
const TEXTURE_PATH = "/textures/wall-concrete.jpg";

const DOOR_OFFSET = new THREE.Vector3(0.2916, -0.4473, 0.2331);

interface GLTFResult {
  nodes: {
    Wall_Right: THREE.Mesh;
    Wall_Left: THREE.Mesh;
  };
  materials: {
    Mat_WallBack: THREE.MeshStandardMaterial;
    Mat_WallFront: THREE.MeshStandardMaterial;
  };
}

function applyPlanarUV(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute("uv")) return;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const width = box.max.x - box.min.x || 1;
  const height = box.max.y - box.min.y || 1;
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) - box.min.x) / width;
    uv[i * 2 + 1] = (position.getY(i) - box.min.y) / height;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

export default function WallsModel(props: ThreeElements["group"]) {
  const { nodes, materials } = useGLTF(MODEL_PATH) as unknown as GLTFResult;
  const texture = useTexture(TEXTURE_PATH);
  const inner = useRef<THREE.Group>(null);
  const content = useRef<THREE.Group>(null);

  useEffect(() => {
    applyPlanarUV(nodes.Wall_Right.geometry);
    applyPlanarUV(nodes.Wall_Left.geometry);
  }, [nodes]);

  useEffect(() => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  useEffect(() => {
    for (const mat of [materials.Mat_WallFront, materials.Mat_WallBack]) {
      mat.map = texture;
      mat.color.set("#ffffff");
      mat.roughness = 0.85;
      mat.metalness = 0;
      // Trimmed down from 1.35 alongside HeroScene's dimmer Lightformers —
      // full strength let the all-directions environment map act as a
      // second, uncontrolled light source and wash out the single-sided
      // key light's shadow.
      mat.envMapIntensity = 0.45;
      mat.needsUpdate = true;
    }
  }, [materials, texture]);

  useEffect(() => {
    const group = content.current;
    if (!group) return;
    // Walk the whole subtree rather than assuming every direct child is a
    // mesh — WallGlowBacking nests its mesh (and now a pointLight) inside
    // its own <group> per panel, so this needs to find meshes at any depth
    // and express their bounds in `group`'s local space via matrixWorld.
    group.updateWorldMatrix(true, true);
    const invGroupWorld = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const relative = new THREE.Matrix4();
    const box = new THREE.Box3();
    const childBox = new THREE.Box3();
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.geometry.computeBoundingBox();
      if (!mesh.geometry.boundingBox) return;
      relative.multiplyMatrices(invGroupWorld, mesh.matrixWorld);
      childBox.copy(mesh.geometry.boundingBox).applyMatrix4(relative);
      box.union(childBox);
    });
    const center = box.getCenter(new THREE.Vector3());
    group.position.copy(center).multiplyScalar(-1);
  }, [nodes]);

  const doorTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const p = scrollState.pointerEased;
    const g = inner.current;
    if (!g) return;
    const progress = scrollState.heroProgress;
    const ease = Math.min(1, delta * 3);

    const targetRotY = p.x * 0.14 - progress * 0.45;
    const targetRotX = -p.y * 0.08 + progress * 0.05;
    g.rotation.y += (targetRotY - g.rotation.y) * ease;
    g.rotation.x += (targetRotX - g.rotation.x) * ease;

    const s = 1 + progress * 0.08;
    g.scale.setScalar(s);

    doorTarget.current
      .copy(DOOR_OFFSET)
      .applyEuler(g.rotation)
      .multiplyScalar(-s * progress);
    g.position.lerp(doorTarget.current, ease);
  });

  return (
    <group {...props} dispose={null}>
      <group ref={inner}>
        <group ref={content}>
          <WallGlowBacking nodes={nodes} />
          <primitive object={nodes.Wall_Right} castShadow receiveShadow />
          <primitive object={nodes.Wall_Left} castShadow receiveShadow />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
useTexture.preload(TEXTURE_PATH);
