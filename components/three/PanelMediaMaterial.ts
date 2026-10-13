import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Thumbnail and video are cover-fitted into the panel, crossfaded by
// uVideoMix, and clipped to the same rounded corners as the RoundedBox body.
// Textures stay in NoColorSpace and nothing is converted on output, so the
// image's sRGB values reach the screen untouched (the panel shader writes
// raw values the same way).
const fragmentShader = `
  uniform sampler2D uImage;
  uniform sampler2D uVideo;
  uniform float uImageAspect;
  uniform float uVideoAspect;
  uniform float uImageReady;
  uniform float uVideoMix;
  uniform float uHover;
  uniform float uFocus;
  uniform float uFade;
  uniform vec2 uSize;
  uniform float uRadius;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv, float mediaAspect) {
    float panelAspect = uSize.x / uSize.y;
    vec2 scale = panelAspect > mediaAspect
      ? vec2(1.0, mediaAspect / panelAspect)
      : vec2(panelAspect / mediaAspect, 1.0);
    // Slow push-in on hover, centered.
    scale *= 1.0 - uHover * 0.035;
    return (uv - 0.5) * scale + 0.5;
  }

  float roundedMask(vec2 uv) {
    vec2 p = (uv - 0.5) * uSize;
    vec2 q = abs(p) - (uSize * 0.5 - uRadius);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float aa = fwidth(d);
    return 1.0 - smoothstep(-aa, aa, d);
  }

  void main() {
    vec3 image = texture2D(uImage, coverUv(vUv, uImageAspect)).rgb;
    vec3 video = texture2D(uVideo, coverUv(vUv, uVideoAspect)).rgb;
    vec3 col = mix(image, video, uVideoMix);

    // Out-of-focus panels recede like the procedural ones: dimmer and
    // slightly desaturated.
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, 0.55 + uFocus * 0.45);
    col *= 0.6 + uFocus * 0.4;

    float alpha = roundedMask(vUv) * uImageReady * uFade;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface PanelMediaUniforms {
  [key: string]: THREE.IUniform;
  uImage: { value: THREE.Texture | null };
  uVideo: { value: THREE.Texture | null };
  uImageAspect: { value: number };
  uVideoAspect: { value: number };
  // 0 → 1 once the thumbnail has decoded, so it fades in over the
  // procedural panel instead of popping.
  uImageReady: { value: number };
  uVideoMix: { value: number };
  uHover: { value: number };
  uFocus: { value: number };
  uFade: { value: number };
  uSize: { value: THREE.Vector2 };
  uRadius: { value: number };
}

export function createPanelMediaMaterial(width: number, height: number, radius: number) {
  const uniforms: PanelMediaUniforms = {
    uImage: { value: null },
    uVideo: { value: null },
    uImageAspect: { value: 16 / 9 },
    uVideoAspect: { value: 16 / 9 },
    uImageReady: { value: 0 },
    uVideoMix: { value: 0 },
    uHover: { value: 0 },
    uFocus: { value: 1 },
    uFade: { value: 1 },
    uSize: { value: new THREE.Vector2(width, height) },
    uRadius: { value: radius },
  };

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
  });
}
