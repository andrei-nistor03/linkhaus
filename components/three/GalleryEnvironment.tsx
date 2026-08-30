"use client";

import { useEffect, useMemo, useRef } from "react";
import { Grid, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PANEL_COUNT, TOTAL_SPAN, panelLayout } from "@/lib/galleryLayout";
import { galleryState } from "@/lib/galleryState";
import { scrollState } from "@/lib/scrollState";

const DUST_COUNT = 160;
const MOTE_COUNT = 70;
const FLOOR_Y = -1.15;

// Local-x range every particle is scattered across — the *full* corridor,
// padded a bit past each end, not a small band recentered on the camera.
// GalleryEnvironment is a child of GalleryTrack, the same group that carries
// every panel/stud/grid line, so leaving particle x alone (instead of
// re-adding galleryState.focusX every frame the way an earlier version did)
// is what makes them scroll along with the rest of the environment rather
// than sitting parallax-locked in front of the camera.
const FIELD_PAD = 10;
const X_MIN = -FIELD_PAD;
const X_MAX = TOTAL_SPAN + FIELD_PAD;
const X_SPAN = X_MAX - X_MIN;
const Y_MIN = -1;
const Y_MAX = 2;
const Y_SPAN = Y_MAX - Y_MIN;
// Kept behind the panel plane (z=0) so nothing ever drifts in front of a
// centered panel and reads as an obstruction.
const Z_MIN = -3.6;
const Z_MAX = -0.6;

// How far a flake reaches out for the cursor before it starts pushing back,
// and how hard it gets shoved at point-blank range. The push target is
// still expressed in *screen*-relative terms (scrollState.pointerEased, the
// same eased signal GalleryCameraRig reads) but has to be converted into
// this field's fixed local space via galleryState.focusX — the local x
// currently centered in front of the camera — since the particles
// themselves no longer recenter on it.
const REPEL_RADIUS = 2;
const REPEL_STRENGTH = 1.1;

// A steady trickle of flakes spontaneously combust: a quick grow-then-vanish
// flash on the flake itself, a firecracker spray of shrapnel debris flung
// outward from that spot, and a pooled point light that actually lights the
// flakes and grid around it for a beat, then the flake reseeds elsewhere in
// the field.
const COMBUST_RATE = 0.02; // ignition chance per particle per second
const BURN_GROW = 0.12; // seconds spent flaring up before vanishing
const BURN_DURATION = 0.42; // total seconds a flake stays "burning"
const BURN_PEAK_SCALE = 2.6;

// Each ignition flings this many shrapnel pieces outward; DEBRIS_POOL is
// the total number of concurrently-animatable pieces shared across every
// simultaneous explosion (round-robin recycled, not allocated per event).
const SHRAPNEL_PER_IGNITE = 12;
const DEBRIS_POOL = 168;
const DEBRIS_LIFE_MIN = 0.3;
const DEBRIS_LIFE_MAX = 0.6;
const DEBRIS_SPEED_MIN = 1.3;
const DEBRIS_SPEED_MAX = 3.2;
const DEBRIS_GRAVITY = 3.4;
const DEBRIS_SCALE_MIN = 0.018;
const DEBRIS_SCALE_MAX = 0.042;
const DEBRIS_COLOR = "#ffd9a0";

const LIGHT_COUNT = 6;
const LIGHT_DURATION = 0.35;
const LIGHT_MAX_INTENSITY = 3.6;
const LIGHT_DISTANCE = 3.4;
const LIGHT_COLOR = "#ffcf8a";

type FlakeState = {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  flatten: number;
  driftX: number;
  rise: number;
  rotDriftX: number;
  rotDriftY: number;
  burning: boolean;
  burnT: number;
};

type PulseState = {
  active: boolean;
  t: number;
  x: number;
  y: number;
  z: number;
};

type DebrisState = {
  active: boolean;
  t: number;
  life: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
};

function makeFlakeStates(
  count: number,
  scaleRange: [number, number],
  flattenRange: [number, number],
  riseRange: [number, number],
  driftRange: number,
  rotDriftRange: number,
): FlakeState[] {
  return Array.from({ length: count }, () => ({
    x: X_MIN + Math.random() * X_SPAN,
    y: Y_MIN + Math.random() * Y_SPAN,
    z: Z_MIN + Math.random() * (Z_MAX - Z_MIN),
    rotX: Math.random() * Math.PI * 2,
    rotY: Math.random() * Math.PI * 2,
    rotZ: Math.random() * Math.PI * 2,
    scale: scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]),
    flatten:
      flattenRange[0] + Math.random() * (flattenRange[1] - flattenRange[0]),
    driftX: (Math.random() - 0.5) * driftRange,
    rise: riseRange[0] + Math.random() * (riseRange[1] - riseRange[0]),
    rotDriftX: (Math.random() - 0.5) * rotDriftRange,
    rotDriftY: (Math.random() - 0.5) * rotDriftRange,
    burning: false,
    burnT: 0,
  }));
}

function makePulsePool(count: number): PulseState[] {
  return Array.from({ length: count }, () => ({
    active: false,
    t: 0,
    x: 0,
    y: 0,
    z: 0,
  }));
}

function makeDebrisPool(count: number): DebrisState[] {
  return Array.from({ length: count }, () => ({
    active: false,
    t: 0,
    life: 0,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    scale: 0,
  }));
}

/**
 * The corridor's supporting architecture: a faint drafting-table floor
 * grid, one thin vertical stud grounding each panel to that floor (echoing
 * the wall/doorway geometry from the hero's 3D model rather than inventing
 * an unrelated visual language), and a field of drifting, cursor-reactive
 * white dust — small instanced polyhedra (not flat sprite points, which
 * never read as more than a smear here) that rise, tumble, and wrap back to
 * the floor as they travel the corridor with everything else. The flake
 * material is self-lit (emissive, untouched by the renderer's tone curve)
 * so it reads as clean white with a soft glow rather than the grey a
 * plain-lit flat-shaded material picks up from grazing light angles.
 *
 * A steady trickle of flakes spontaneously combust — flaring and vanishing
 * while a firecracker spray of shrapnel debris flings outward and a real
 * point light flashes at that spot — then reseed elsewhere, all pooled
 * across a fixed number of concurrent debris pieces/lights rather than
 * spawning new objects per event. Reaching the cursor into the
 * field gently pushes nearby flakes out of the way, the same "the scene
 * notices you" idea as the panels' own tilt-toward-cursor. (Each panel's
 * own violet glow lives in PanelGlow.tsx, rendered alongside ProjectPanel
 * in GalleryScene.tsx, not here.)
 */
export default function GalleryEnvironment({
  reducedMotion = false,
}: {
  reducedMotion?: boolean;
}) {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const flashColor = useMemo(() => new THREE.Color(), []);

  const dustRef = useRef<THREE.InstancedMesh>(null);
  const moteRef = useRef<THREE.InstancedMesh>(null);
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  const dustStates = useMemo(
    () =>
      makeFlakeStates(
        DUST_COUNT,
        [0.018, 0.045],
        [0.6, 1],
        [0.09, 0.2],
        0.08,
        0.6,
      ),
    [],
  );
  const moteStates = useMemo(
    () =>
      makeFlakeStates(
        MOTE_COUNT,
        [0.035, 0.07],
        [0.5, 0.9],
        [0.07, 0.16],
        0.07,
        0.55,
      ),
    [],
  );

  const debris = useMemo(() => makeDebrisPool(DEBRIS_POOL), []);
  const lights = useMemo(() => makePulsePool(LIGHT_COUNT), []);
  const nextDebris = useRef(0);
  const nextLight = useRef(0);

  const dustGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const moteGeometry = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
  const debrisGeometry = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []);
  const flakeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#ffffff",
        emissiveIntensity: 0.45,
        roughness: 0.6,
        metalness: 0,
        flatShading: true,
        transparent: true,
        opacity: 0.92,
        toneMapped: false,
      }),
    [],
  );
  const debrisMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: DEBRIS_COLOR,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(() => {
    const mesh = debrisRef.current;
    if (mesh) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(DEBRIS_POOL * 3),
        3,
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      dustGeometry.dispose();
      moteGeometry.dispose();
      debrisGeometry.dispose();
      flakeMaterial.dispose();
      debrisMaterial.dispose();
    };
  }, [
    dustGeometry,
    moteGeometry,
    debrisGeometry,
    flakeMaterial,
    debrisMaterial,
  ]);

  // Firecracker spray: SHRAPNEL_PER_IGNITE pieces flung out in random
  // directions (mild upward kick, gravity pulls them back down over their
  // short life) rather than one expanding shockwave shell.
  const spawnCombustion = (x: number, y: number, z: number) => {
    for (let k = 0; k < SHRAPNEL_PER_IGNITE; k++) {
      const d = debris[nextDebris.current % DEBRIS_POOL];
      nextDebris.current++;

      const dirX = Math.random() - 0.5;
      const dirY = Math.random() - 0.5;
      const dirZ = (Math.random() - 0.5) * 0.4;
      const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
      const speed =
        DEBRIS_SPEED_MIN +
        Math.random() * (DEBRIS_SPEED_MAX - DEBRIS_SPEED_MIN);

      d.active = true;
      d.t = 0;
      d.life =
        DEBRIS_LIFE_MIN + Math.random() * (DEBRIS_LIFE_MAX - DEBRIS_LIFE_MIN);
      d.x = x;
      d.y = y;
      d.z = z;
      d.vx = (dirX / len) * speed;
      d.vy = (dirY / len) * speed + speed * 0.3;
      d.vz = (dirZ / len) * speed;
      d.scale =
        DEBRIS_SCALE_MIN +
        Math.random() * (DEBRIS_SCALE_MAX - DEBRIS_SCALE_MIN);
    }

    const light = lights[nextLight.current % LIGHT_COUNT];
    nextLight.current++;
    light.active = true;
    light.t = 0;
    light.x = x;
    light.y = y;
    light.z = z;
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    const pointer = scrollState.pointerEased;
    const pushOriginX = galleryState.focusX + pointer.x * (X_SPAN * 0.12);
    const pushOriginY = -pointer.y * (Y_SPAN * 0.5);

    const updateField = (
      mesh: THREE.InstancedMesh | null,
      states: FlakeState[],
    ) => {
      if (!mesh) return;
      for (let i = 0; i < states.length; i++) {
        const s = states[i];
        let justIgnited = false;

        if (!reducedMotion) {
          if (s.burning) {
            s.burnT += delta;
            if (s.burnT >= BURN_DURATION) {
              s.burning = false;
              s.x = X_MIN + Math.random() * X_SPAN;
              s.y = Y_MIN + Math.random() * Y_SPAN;
              s.z = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
            }
          } else {
            s.x += s.driftX * delta;
            s.y += s.rise * delta;
            s.rotX += s.rotDriftX * delta;
            s.rotY += s.rotDriftY * delta;

            if (s.y > Y_MAX) {
              s.y = Y_MIN;
              s.x = X_MIN + Math.random() * X_SPAN;
            }
            if (s.x > X_MAX) s.x -= X_SPAN;
            else if (s.x < X_MIN) s.x += X_SPAN;

            if (Math.random() < COMBUST_RATE * delta) {
              s.burning = true;
              s.burnT = 0;
              justIgnited = true;
            }
          }
        }

        let pushX = 0;
        let pushY = 0;
        if (!reducedMotion) {
          const dx = s.x - pushOriginX;
          const dy = s.y - pushOriginY;
          const distSq = dx * dx + dy * dy;
          if (distSq < REPEL_RADIUS * REPEL_RADIUS) {
            const dist = Math.sqrt(distSq) || 0.001;
            const falloff = 1 - dist / REPEL_RADIUS;
            const force = falloff * falloff * REPEL_STRENGTH;
            pushX = (dx / dist) * force;
            pushY = (dy / dist) * force;
          }
        }

        const finalX = s.x + pushX;
        const finalY = s.y + pushY;
        const finalZ = s.z;

        let burnScale = 1;
        if (s.burning) {
          burnScale =
            s.burnT < BURN_GROW
              ? 1 + (s.burnT / BURN_GROW) * (BURN_PEAK_SCALE - 1)
              : Math.max(
                  0,
                  BURN_PEAK_SCALE *
                    (1 - (s.burnT - BURN_GROW) / (BURN_DURATION - BURN_GROW)),
                );
        }

        if (justIgnited) spawnCombustion(finalX, finalY, finalZ);

        dummy.position.set(finalX, finalY, finalZ);
        dummy.rotation.set(s.rotX, s.rotY, s.rotZ);
        const sc = s.scale * burnScale;
        dummy.scale.set(sc, sc * s.flatten, sc * 0.8);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateField(dustRef.current, dustStates);
    updateField(moteRef.current, moteStates);

    const debrisMesh = debrisRef.current;
    if (debrisMesh) {
      for (let i = 0; i < debris.length; i++) {
        const d = debris[i];
        if (d.active) {
          d.t += delta;
          if (d.t >= d.life) {
            d.active = false;
          } else {
            d.vy -= DEBRIS_GRAVITY * delta;
            d.x += d.vx * delta;
            d.y += d.vy * delta;
            d.z += d.vz * delta;
          }
        }

        if (d.active) {
          const p = d.t / d.life;
          const sc = d.scale * (1 - p * 0.6);
          dummy.position.set(d.x, d.y, d.z);
          dummy.rotation.set(p * 6, p * 4.2, 0);
          dummy.scale.set(sc, sc, sc);
          flashColor.setScalar(Math.max(0, 1 - p));
        } else {
          dummy.position.set(d.x, d.y, d.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(0, 0, 0);
          flashColor.setScalar(0);
        }
        dummy.updateMatrix();
        debrisMesh.setMatrixAt(i, dummy.matrix);
        debrisMesh.setColorAt(i, flashColor);
      }
      debrisMesh.instanceMatrix.needsUpdate = true;
      if (debrisMesh.instanceColor) debrisMesh.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < lights.length; i++) {
      const l = lights[i];
      const ref = lightRefs.current[i];
      if (!ref) continue;
      if (l.active) {
        l.t += delta;
        if (l.t >= LIGHT_DURATION) l.active = false;
      }
      if (!l.active) {
        ref.intensity = 0;
        continue;
      }
      const p = l.t / LIGHT_DURATION;
      const envelope = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      ref.intensity = LIGHT_MAX_INTENSITY * Math.max(0, envelope);
      ref.position.set(l.x, l.y, l.z);
    }
  });

  const studs = useMemo(
    () =>
      Array.from({ length: PANEL_COUNT }, (_, i) => {
        const { position } = panelLayout(i);
        return [
          [position.x, FLOOR_Y, position.z] as [number, number, number],
          [position.x, position.y - 0.15, position.z] as [
            number,
            number,
            number,
          ],
        ];
      }),
    [],
  );

  return (
    <>
      <Grid
        position={[TOTAL_SPAN / 2, FLOOR_Y, 0]}
        args={[TOTAL_SPAN + 20, 12]}
        cellSize={0.55}
        cellThickness={0.5}
        cellColor="#dedad0"
        sectionSize={2.2}
        sectionThickness={0.9}
        sectionColor="#c9c4b6"
        fadeDistance={16}
        fadeStrength={1.4}
        followCamera={false}
        infiniteGrid={false}
      />

      {studs.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#dedad0"
          transparent
          opacity={0.55}
          lineWidth={1}
        />
      ))}

      <instancedMesh
        ref={dustRef}
        args={[dustGeometry, flakeMaterial, DUST_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={moteRef}
        args={[moteGeometry, flakeMaterial, MOTE_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={debrisRef}
        args={[debrisGeometry, debrisMaterial, DEBRIS_POOL]}
        frustumCulled={false}
      />

      {Array.from({ length: LIGHT_COUNT }, (_, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lightRefs.current[i] = el;
          }}
          intensity={0}
          distance={LIGHT_DISTANCE}
          decay={2}
          color={LIGHT_COLOR}
        />
      ))}
    </>
  );
}
