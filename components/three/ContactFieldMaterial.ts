import * as THREE from "three";

const vertexShader =  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader =  `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uHover;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uReduced;
  varying vec2 vUv;

  vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289v3(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * snoise(p);
      p *= 2.02;
      amp *= 0.55;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= uAspect;

    float t = uTime * mix(1.0, 0.06, uReduced);

    vec2 warp = vec2(
      fbm(uv * 0.8 + t * 0.03),
      fbm(uv * 0.8 - t * 0.025 + 4.2)
    );
    float n = fbm(uv * 1.05 + warp * 0.55 + t * 0.015);

    vec2 c1 = vec2(sin(t * 0.11) * 0.34, cos(t * 0.085) * 0.22 - 0.04);
    vec2 c2 = vec2(cos(t * 0.07 + 2.0) * 0.38, sin(t * 0.09 + 1.4) * 0.26 + 0.14);
    float d1 = length((uv - c1) * vec2(1.0, 1.3));
    float d2 = length((uv - c2) * vec2(1.0, 1.3));
    float blob1 = smoothstep(0.62, 0.0, d1);
    float blob2 = smoothstep(0.55, 0.0, d2);

    vec3 ink = vec3(0.051, 0.051, 0.051);
    vec3 violet = vec3(0.541, 0.361, 1.0);
    vec3 deepViolet = vec3(0.11, 0.05, 0.24);
    vec3 paper = vec3(0.961, 0.953, 0.933);

    vec3 col = ink;
    col = mix(col, deepViolet, blob1 * 0.9 + blob2 * 0.7);
    col += violet * (blob1 * 0.5 + blob2 * 0.35) * (0.4 + n * 0.6);
    col += violet * 0.05 * n;

    vec2 pUv = uPointer * vec2(uAspect, 1.0) * 0.5;
    float pd = length(uv - pUv);
    float pointerGlow = smoothstep(0.55, 0.0, pd) * (0.2 + uHover * 0.55);
    float ripple = smoothstep(0.02, 0.0, abs(fract(pd * 3.0 - t * 0.25) - 0.5) - 0.47) * 0.05 * (1.0 - uReduced);
    col += paper * (pointerGlow + ripple);

    col = mix(ink, col, clamp(uIntensity, 0.0, 1.0));

    float vig = smoothstep(0.95, 0.25, length(uv * vec2(1.0, 1.15)));
    col *= mix(0.55, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface ContactFieldUniforms {
  [key: string]: THREE.IUniform;
  uTime: { value: number };
  uIntensity: { value: number };
  uHover: { value: number };
  uPointer: { value: THREE.Vector2 };
  uAspect: { value: number };
  uReduced: { value: number };
}

export function createContactFieldMaterial() {
  const uniforms: ContactFieldUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uHover: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uAspect: { value: 1 },
    uReduced: { value: 0 },
  };

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthWrite: false,
    depthTest: false,
  });
}
