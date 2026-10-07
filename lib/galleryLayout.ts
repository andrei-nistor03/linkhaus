import * as THREE from "three";
import { PROJECTS } from "@/components/projects/projectsData";

export const PANEL_COUNT = PROJECTS.length;
export const PANEL_WIDTH = 2.7;
export const PANEL_HEIGHT = 1.62;
export const PANEL_DEPTH = 0.07;

// The gallery runs as a horizontal rail on desktop/tablet and as a vertical
// stack on mobile (panels one under the other, scrolled upward). Everything
// downstream works in "along-track" coordinates so both modes share the same
// focus/scroll math — only the axis and the spacing change.
export const VERTICAL_QUERY = "(max-width: 639px)";

export const SPACING = 4.4;
// Stacked on their short edge the panels need a tighter gap, but one still
// wide enough for the caption pills that sit above and below each panel.
export const VERTICAL_SPACING = 3;

export interface GalleryMetrics {
  vertical: boolean;
  spacing: number;
  totalSpan: number;
  entryPadding: number;
  trackLength: number;
  focusWindow: number;
}

export function galleryMetrics(vertical: boolean): GalleryMetrics {
  const spacing = vertical ? VERTICAL_SPACING : SPACING;
  const totalSpan = (PANEL_COUNT - 1) * spacing;
  const entryPadding = spacing * 0.55;
  return {
    vertical,
    spacing,
    totalSpan,
    entryPadding,
    trackLength: totalSpan + entryPadding,
    focusWindow: spacing * 0.85,
  };
}

export const HORIZONTAL_METRICS = galleryMetrics(false);
export const TOTAL_SPAN = HORIZONTAL_METRICS.totalSpan;

// Where the track group sits along its axis for a given scroll progress:
// horizontal mode slides left, vertical mode slides up.
export function trackOffset(progress: number, m: GalleryMetrics) {
  return m.vertical
    ? progress * m.trackLength - m.entryPadding
    : m.entryPadding - progress * m.trackLength;
}

// Id given to the gallery's pinned ScrollTrigger.
export const GALLERY_SCROLL_TRIGGER_ID = "gallery-scroll";

export const SCENE_PAPER = "#f5f3ee";
export const SCENE_DARK = "#0d0d0d";
export const ENTRY_FADE_FRACTION = 0.08;

export interface PanelLayout {
  // The panel's own coordinate along the track axis. Compared against
  // galleryState.focus to get the panel's distance from frame center.
  trackCoord: number;
  position: THREE.Vector3;
  rotationY: number;
}

export function panelLayout(i: number, m: GalleryMetrics): PanelLayout {
  const side = i % 2 === 0 ? 1 : -1;
  const trackCoord = m.vertical ? -i * m.spacing : i * m.spacing;
  return {
    trackCoord,
    position: m.vertical
      ? new THREE.Vector3(0, trackCoord, 0)
      : new THREE.Vector3(trackCoord, 0, 0),
    rotationY: -side * 0.16,
  };
}
