import * as THREE from "three";
import { PROJECTS } from "@/components/projects/projectsData";

export const PANEL_COUNT = PROJECTS.length;
export const PANEL_WIDTH = 2.7;
export const PANEL_HEIGHT = 1.62;
export const PANEL_DEPTH = 0.07;
export const SPACING = 4.4;
export const TOTAL_SPAN = (PANEL_COUNT - 1) * SPACING;
export const ENTRY_PADDING = SPACING * 0.55;
export const TRACK_LENGTH = TOTAL_SPAN + ENTRY_PADDING;

export function trackOffsetX(progress: number) {
  return ENTRY_PADDING - progress * TRACK_LENGTH;
}

// Inverse of trackOffsetX: the scroll progress (0-1) at which panel `i`
// sits centered under the camera. Used to scroll a tapped panel into view.
export function progressForIndex(i: number) {
  return (i * SPACING + ENTRY_PADDING) / TRACK_LENGTH;
}

// Id given to the gallery's pinned ScrollTrigger so other components (e.g.
// a tapped panel on touch) can look up its scroll bounds and jump to a
// specific progress value.
export const GALLERY_SCROLL_TRIGGER_ID = "gallery-scroll";

export const FOCUS_WINDOW = SPACING * 0.85;

export const SCENE_PAPER = "#f5f3ee";
export const SCENE_DARK = "#0d0d0d";
export const ENTRY_FADE_FRACTION = 0.08;

export interface PanelLayout {
  position: THREE.Vector3;
  rotationY: number;
}

export function panelLayout(i: number): PanelLayout {
  const side = i % 2 === 0 ? 1 : -1;
  return {
    position: new THREE.Vector3(i * SPACING, 0, 0),
    rotationY: -side * 0.16,
  };
}
