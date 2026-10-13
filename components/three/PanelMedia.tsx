"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { galleryState } from "@/lib/galleryState";
import { createPanelMediaMaterial } from "./PanelMediaMaterial";
import { PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH } from "@/lib/galleryLayout";

// Per-frame values ProjectPanel already computes, shared instead of redone.
export interface PanelMediaSignals {
  focus: number;
  hover: number;
  fade: number;
}

interface PanelMediaProps {
  index: number;
  thumbnail: string;
  video?: string;
  isTouch: boolean;
  reducedMotion: boolean;
  signals: React.RefObject<PanelMediaSignals>;
}

const CORNER_RADIUS = 0.045;
// The video element is only created once the panel gets this close to the
// frame center, so a visitor who never reaches it never downloads it.
const PRELOAD_FOCUS = 0.05;
// Touch devices have no hover, so the video plays on its own once scrolling
// has brought the panel (almost) to the center, and stops as it leaves.
const TOUCH_PLAY_FOCUS = 0.8;
// Desktop hover only counts while the panel is reasonably centered; a panel
// sliding away under a still cursor shouldn't keep playing.
const HOVER_PLAY_FOCUS = 0.3;

function prefersSaveData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

export default function PanelMedia({ index, thumbnail, video, isTouch, reducedMotion, signals }: PanelMediaProps) {
  const gl = useThree((s) => s.gl);
  const material = useMemo(() => createPanelMediaMaterial(PANEL_WIDTH, PANEL_HEIGHT, CORNER_RADIUS), []);
  useEffect(() => () => material.dispose(), [material]);

  const imageLoaded = useRef(false);
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const videoTexture = useRef<THREE.VideoTexture | null>(null);
  const playing = useRef(false);
  const frameReady = useRef(false);
  const canvasVisible = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let texture: THREE.Texture | null = null;
    new THREE.TextureLoader().load(thumbnail, (tex) => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      texture = tex;
      // The panels sit at an angle off-center; anisotropic filtering keeps
      // the image crisp there instead of smearing.
      tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      const img = tex.image as HTMLImageElement;
      material.uniforms.uImage.value = tex;
      material.uniforms.uImageAspect.value = img.width / img.height;
      imageLoaded.current = true;
    });
    return () => {
      cancelled = true;
      texture?.dispose();
      imageLoaded.current = false;
    };
  }, [thumbnail, material, gl]);

  // The canvas keeps rendering while the section is off-screen (and panel 0
  // is "focused" at progress 0), so autoplay also waits for the canvas to
  // actually be in view.
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      canvasVisible.current = entry.isIntersecting;
      // The scene stops rendering once it's off-screen, so useFrame won't be
      // around to pause the video — do it here.
      if (!entry.isIntersecting && playing.current) {
        playing.current = false;
        videoEl.current?.pause();
      }
    });
    observer.observe(gl.domElement);
    return () => observer.disconnect();
  }, [gl]);

  useEffect(() => {
    return () => {
      const el = videoEl.current;
      if (el) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
      videoTexture.current?.dispose();
      videoEl.current = null;
      videoTexture.current = null;
      playing.current = false;
      frameReady.current = false;
    };
  }, [video]);

  // Touch autoplay is skipped for reduced motion and data-saver users; they
  // get the thumbnail. Desktop hover is an explicit request, so it always plays.
  const touchAutoplay = useMemo(
    () => isTouch && !reducedMotion && typeof navigator !== "undefined" && !prefersSaveData(),
    [isTouch, reducedMotion],
  );

  const ensureVideo = () => {
    if (videoEl.current || !video) return;
    const el = document.createElement("video");
    el.src = video;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = "auto";
    el.disablePictureInPicture = true;
    el.addEventListener("loadedmetadata", () => {
      if (el.videoWidth && el.videoHeight) {
        material.uniforms.uVideoAspect.value = el.videoWidth / el.videoHeight;
      }
    });
    el.addEventListener("playing", () => {
      frameReady.current = true;
    });
    el.addEventListener("pause", () => {
      frameReady.current = false;
    });
    const tex = new THREE.VideoTexture(el);
    videoEl.current = el;
    videoTexture.current = tex;
    material.uniforms.uVideo.value = tex;
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    const { focus, hover, fade } = signals.current;
    const u = material.uniforms;

    u.uFocus.value = focus;
    u.uHover.value = hover;
    u.uFade.value = fade;
    u.uImageReady.value += ((imageLoaded.current ? 1 : 0) - u.uImageReady.value) * Math.min(1, delta * 5);

    if (!video) return;
    if (focus > PRELOAD_FOCUS) ensureVideo();

    const shouldPlay =
      canvasVisible.current &&
      (isTouch
        ? touchAutoplay && focus > TOUCH_PLAY_FOCUS
        : galleryState.hoveredIndex === index && focus > HOVER_PLAY_FOCUS);

    const el = videoEl.current;
    if (el && shouldPlay !== playing.current) {
      playing.current = shouldPlay;
      if (shouldPlay) {
        // If the browser refuses playback, the thumbnail simply stays up
        // (the crossfade waits for a real "playing" event).
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    }

    const mixTarget = playing.current && frameReady.current ? 1 : 0;
    u.uVideoMix.value += (mixTarget - u.uVideoMix.value) * Math.min(1, delta * 6);
  });

  return (
    <mesh position={[0, 0, PANEL_DEPTH / 2 + 0.0015]} renderOrder={1}>
      <planeGeometry args={[PANEL_WIDTH, PANEL_HEIGHT]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
