"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";

const NOTCH_LOCAL_CENTER = new THREE.Vector2(0.909, 0.469);

const WELD_EPSILON = 4;
const AXIS_EPSILON = 1e-3;

type PanelKey = "Wall_Right" | "Wall_Left";

const PANEL_TUNING: Record<PanelKey, { hotspot?: THREE.Vector2; push: number; color: string }> = {
  Wall_Right: {
    hotspot: NOTCH_LOCAL_CENTER,
    push: -0.25,
    color: "#9d6bff",
  },
  Wall_Left: {
    push: -0.16,
    color: "#7a4ce0",
  },
};

function traceCapBoundaryLoops(
  geometry: THREE.BufferGeometry,
): THREE.Vector2[][] {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  if (!position || !index) return [];

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return [];
  const frontZ = box.max.z;
  const eps = 1e-4;

  const idOf = new Map<string, number>();
  const coords: THREE.Vector2[] = [];
  const weldKey = (i: number) =>
    `${position.getX(i).toFixed(WELD_EPSILON)}:${position.getY(i).toFixed(WELD_EPSILON)}`;
  const weld = (i: number) => {
    const key = weldKey(i);
    let id = idOf.get(key);
    if (id === undefined) {
      id = coords.length;
      coords.push(new THREE.Vector2(position.getX(i), position.getY(i)));
      idOf.set(key, id);
    }
    return id;
  };

  const edgeCount = new Map<string, number>();
  const edgeVerts = new Map<string, [number, number]>();
  const bumpEdge = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
    edgeVerts.set(key, [a, b]);
  };

  for (let t = 0; t < index.count; t += 3) {
    const ia = index.getX(t);
    const ib = index.getX(t + 1);
    const ic = index.getX(t + 2);
    if (Math.abs(position.getZ(ia) - frontZ) > eps) continue;
    if (Math.abs(position.getZ(ib) - frontZ) > eps) continue;
    if (Math.abs(position.getZ(ic) - frontZ) > eps) continue;
    const wa = weld(ia);
    const wb = weld(ib);
    const wc = weld(ic);
    bumpEdge(wa, wb);
    bumpEdge(wb, wc);
    bumpEdge(wc, wa);
  }

  const adjacency = new Map<number, number[]>();
  const boundaryEdgeKeys: string[] = [];
  for (const [key, count] of edgeCount) {
    if (count !== 1) continue;
    boundaryEdgeKeys.push(key);
    const [a, b] = edgeVerts.get(key)!;
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push(b);
    adjacency.get(b)!.push(a);
  }

  const visited = new Set<string>();
  const loops: THREE.Vector2[][] = [];
  for (const key of boundaryEdgeKeys) {
    if (visited.has(key)) continue;
    const [start, second] = edgeVerts.get(key)!;
    const loopIds = [start];
    let prev = start;
    let curr = second;
    visited.add(key);
    let guard = 0;
    while (curr !== start && guard++ < coords.length * 2) {
      loopIds.push(curr);
      const neighbors = adjacency.get(curr);
      if (!neighbors || neighbors.length !== 2) break; // non-manifold boundary; bail on this loop
      const next = neighbors[0] === prev ? neighbors[1] : neighbors[0];
      const ek = curr < next ? `${curr}_${next}` : `${next}_${curr}`;
      visited.add(ek);
      prev = curr;
      curr = next;
    }
    if (curr === start && loopIds.length >= 3) {
      loops.push(loopIds.map((id) => coords[id]));
    }
  }
  return loops;
}

function shoelaceArea(loop: THREE.Vector2[]) {
  let area = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function fillAxisAlignedNotches(loop: THREE.Vector2[]): THREE.Vector2[] {
  const signedArea = shoelaceArea(loop);
  if (signedArea === 0) return loop;
  const ccw = signedArea > 0;

  let points = loop.slice();
  for (let guard = 0; guard < points.length; guard++) {
    const n = points.length;
    if (n <= 3) break;
    let filledIndex = -1;
    let fillPoint: THREE.Vector2 | null = null;
    for (let i = 0; i < n; i++) {
      const prev = points[(i - 1 + n) % n];
      const curr = points[i];
      const next = points[(i + 1) % n];
      const cross =
        (curr.x - prev.x) * (next.y - curr.y) -
        (curr.y - prev.y) * (next.x - curr.x);
      const isReflex = ccw ? cross < 0 : cross > 0;
      if (!isReflex) continue;
      const prevVertical = Math.abs(curr.x - prev.x) < AXIS_EPSILON;
      const prevHorizontal = Math.abs(curr.y - prev.y) < AXIS_EPSILON;
      const nextVertical = Math.abs(next.x - curr.x) < AXIS_EPSILON;
      const nextHorizontal = Math.abs(next.y - curr.y) < AXIS_EPSILON;
      if (prevVertical && nextHorizontal) {
        fillPoint = new THREE.Vector2(next.x, prev.y);
      } else if (prevHorizontal && nextVertical) {
        fillPoint = new THREE.Vector2(prev.x, next.y);
      } else {
        continue;
      }
      filledIndex = i;
      break;
    }
    if (filledIndex === -1 || !fillPoint) break;
    const prevIdx = (filledIndex - 1 + n) % n;
    const nextIdx = (filledIndex + 1) % n;
    const next: THREE.Vector2[] = [];
    for (let i = 0; i < n; i++) {
      if (i === prevIdx || i === nextIdx) continue;
      next.push(i === filledIndex ? fillPoint : points[i]);
    }
    points = next;
  }
  return points;
}

function makeBackingGeometry(source: THREE.BufferGeometry, extraPush: number) {
  source.computeBoundingBox();
  const box = source.boundingBox;
  if (!box) return null;
  const depth = box.max.z - box.min.z;
  const pushBack = Math.max(0.05, depth * 2) + extraPush;
  const z = box.min.z - pushBack;

  const loops = traceCapBoundaryLoops(source);
  let outline: THREE.Vector2[];
  if (loops.length > 0) {
    loops.sort((a, b) => Math.abs(shoelaceArea(b)) - Math.abs(shoelaceArea(a)));
    outline = fillAxisAlignedNotches(loops[0]);
  } else {
    // Fallback: plain bounding-box rectangle.
    outline = [
      new THREE.Vector2(box.min.x, box.min.y),
      new THREE.Vector2(box.max.x, box.min.y),
      new THREE.Vector2(box.max.x, box.max.y),
      new THREE.Vector2(box.min.x, box.max.y),
    ];
  }

  const triangles = THREE.ShapeUtils.triangulateShape(outline, []);
  if (triangles.length === 0) return null;

  const positions = new Float32Array(outline.length * 3);
  const uvs = new Float32Array(outline.length * 2);
  const width = box.max.x - box.min.x || 1;
  const height = box.max.y - box.min.y || 1;
  outline.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = z;
    uvs[i * 2] = (p.x - box.min.x) / width;
    uvs[i * 2 + 1] = (p.y - box.min.y) / height;
  });
  const indices = triangles.flat();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, box, z };
}
function coreTint(color: string) {
  return new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.55);
}

function makeGlowTexture(color: string, hotspot: [number, number]) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const hx = hotspot[0] * size;
  const hy = (1 - hotspot[1]) * size; // canvas Y grows down; UV V grows up
  const tint = coreTint(color);

  const gradient = ctx.createRadialGradient(hx, hy, 0, hx, hy, size);
  gradient.addColorStop(0, `#${tint.getHexString()}`);
  gradient.addColorStop(0.12, "#e4d3ff");
  gradient.addColorStop(0.32, color);
  gradient.addColorStop(0.64, "#3a1785");
  gradient.addColorStop(1, "rgba(10, 0, 30, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function BackingPanel({
  node,
  hotspotLocal,
  color,
  push,
  phase,
}: {
  node: THREE.Mesh;
  hotspotLocal?: THREE.Vector2;
  color: string;
  push: number;
  phase: number;
}) {
  const built = useMemo(
    () => makeBackingGeometry(node.geometry, push),
    [node, push],
  );

  const texture = useMemo(() => {
    if (!built) return null;
    const { box } = built;
    const width = box.max.x - box.min.x || 1;
    const height = box.max.y - box.min.y || 1;
    const hotspot: [number, number] = hotspotLocal
      ? [
          (hotspotLocal.x - box.min.x) / width,
          (hotspotLocal.y - box.min.y) / height,
        ]
      : [0.5, 0.5];
    return makeGlowTexture(color, hotspot);
  }, [built, hotspotLocal, color]);

  // The actual light source that shines through this panel's opening —
  // parked right at the notch/gap in the wall's own coordinate space (same
  // space the backing geometry above is built in), so it lines up with the
  // hole in the front cap rather than sitting flush against the backing
  // plane behind it.
  const openingPos = useMemo(() => {
    if (!built) return null;
    const { box } = built;
    const local = hotspotLocal ?? new THREE.Vector2(
      (box.min.x + box.max.x) / 2,
      (box.min.y + box.max.y) / 2,
    );
    const depth = box.max.z - box.min.z || 0.1;
    return new THREE.Vector3(local.x, local.y, box.max.z + depth * 0.4);
  }, [built, hotspotLocal]);

  const lightColor = useMemo(() => `#${coreTint(color).getHexString()}`, [color]);
  const light = useRef<THREE.PointLight>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const breathe = 0.5 + Math.sin(t.current * 1.4 + phase) * 0.3;
    if (light.current) {
      light.current.intensity = 1.8 + breathe * 1.8 + scrollState.heroProgress * 2.6;
    }
    // Drive the visible glow texture with the same breathe cycle as the
    // point light it's paired with — previously only the (mostly hidden,
    // occluded-by-the-front-cap) light pulsed, so the glow anyone actually
    // sees on screen just sat there at a flat, constant brightness. Pulses
    // via the material's color (brightness), not opacity — opacity stays
    // at a solid 1 so the panel never goes see-through.
    if (material.current) {
      const brightness = 0.82 + breathe * 0.28 + scrollState.heroProgress * 0.1;
      material.current.color.setScalar(brightness);
    }
  });

  if (!built || !texture || !openingPos) return null;

  return (
    <group position={node.position} quaternion={node.quaternion} scale={node.scale}>
      <mesh geometry={built.geometry}>
        <meshBasicMaterial
          ref={material}
          map={texture}
          transparent
          depthWrite={false}
          toneMapped={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight
        ref={light}
        position={openingPos}
        color={lightColor}
        intensity={1.8}
        distance={5}
        decay={1.5}
      />
    </group>
  );
}

export default function WallGlowBacking({
  nodes,
}: {
  nodes: { Wall_Right: THREE.Mesh; Wall_Left: THREE.Mesh };
}) {
  return (
    <>
      {(Object.keys(PANEL_TUNING) as PanelKey[]).map((key, i) => {
        const tuning = PANEL_TUNING[key];
        return (
          <BackingPanel
            key={key}
            node={nodes[key]}
            hotspotLocal={tuning.hotspot}
            push={tuning.push}
            color={tuning.color}
            phase={i * 1.9}
          />
        );
      })}
    </>
  );
}
