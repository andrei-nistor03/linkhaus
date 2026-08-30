import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A GPU-only, no-asset stand-in for the real video/GIF preview: an animated
// duotone halftone (same dot-field language as HalftoneBackground.tsx,
// computed per-pixel instead of on a 2D canvas) that idles as a mostly still
// textured surface and, on hover, speeds up and gains a moving scan band —
// enough motion to read as "footage playing" without shipping media files.
// uFocus (how centered this panel currently is) dims/desaturates panels the
// camera isn't near, standing in for the depth-of-field the brief asks for
// without an actual postprocessing pass.
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uFocus;
  uniform float uSeed;
  uniform vec3 uColorPaper;
  uniform vec3 uColorAccent;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;

    float cell = mix(24.0, 40.0, uHover);
    vec2 grid = uv * vec2(cell * 1.62, cell);
    vec2 gi = floor(grid);
    vec2 gf = fract(grid) - 0.5;

    float n = hash(gi + uSeed);
    float flow = sin((gi.x * 0.35 + gi.y * 0.28) + uTime * (0.35 + uHover * 2.4) + uSeed * 6.283) * 0.5 + 0.5;
    float value = mix(n, flow, 0.3 + uHover * 0.5);

    float r = mix(0.09, 0.47, value) * mix(0.6, 1.0, uFocus);
    float dotMask = smoothstep(r, r - 0.055, length(gf));

    vec3 dim = mix(uColorPaper, uColorAccent * 0.55 + uColorPaper * 0.25, 0.22);
    vec3 lit = mix(uColorPaper, uColorAccent, 0.82);
    vec3 col = mix(dim, lit, dotMask);

    // A soft diagonal band sweeping across on hover — the closest a static
    // dot-field can get to "scrubbing through a clip" without real frames.
    float bandPhase = fract(uv.x * 1.3 + uv.y * 0.4 - uTime * 0.55 * uHover - uSeed);
    float band = smoothstep(0.08, 0.0, abs(bandPhase - 0.5));
    col += band * uHover * 0.16 * uColorAccent;

    float vig = smoothstep(0.82, 0.2, length(uv - 0.5));
    col = mix(col * 0.72, col, vig);

    float grain = (hash(uv * 620.0 + uTime * 0.6) - 0.5) * 0.045;
    col += grain;

    // Background (unfocused) panels fade back toward flat paper — the
    // "smaller, more transparent, less prominent" read from the brief.
    col = mix(uColorPaper, col, 0.32 + uFocus * 0.68);
    float alpha = mix(0.55, 1.0, uFocus * 0.75 + uHover * 0.25);

    gl_FragColor = vec4(col, alpha);
  }
`;

export interface PanelMaterialUniforms {
  [key: string]: THREE.IUniform;
  uTime: { value: number };
  uHover: { value: number };
  uFocus: { value: number };
  uSeed: { value: number };
  uColorPaper: { value: THREE.Color };
  uColorAccent: { value: THREE.Color };
}

/** One ShaderMaterial instance per panel (uSeed/uColorAccent differ per
 *  project) — created imperatively rather than via drei's `shaderMaterial` +
 *  `extend` so panels can update uniforms straight through a ref in
 *  useFrame with zero React re-renders, same reasoning as scrollState.ts. */
export function createPanelMaterial(accentHex: string, seed: number) {
  const uniforms: PanelMaterialUniforms = {
    uTime: { value: 0 },
    uHover: { value: 0 },
    uFocus: { value: 1 },
    uSeed: { value: seed },
    uColorPaper: { value: new THREE.Color("#f5f3ee") },
    uColorAccent: { value: new THREE.Color(accentHex) },
  };

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
  });
}
