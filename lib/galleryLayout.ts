import * as THREE from "three";
import { PROJECTS } from "@/components/projects/projectsData";

/**
 * Shared spatial constants for the gallery corridor. The camera is
 * (almost) fixed — see GalleryCameraRig — and it's the *scene* that
 * travels: GalleryTrack slides one group containing every panel plus
 * GalleryEnvironment along x as the user scrolls, so every panel is
 * carried past a single, unmoving vantage point rather than each being
 * visited by a camera whose own path/orientation could vary panel to
 * panel. Every consumer (ProjectPanel, GalleryEnvironment, GalleryTrack)
 * derives its numbers from this one file so none of it can drift out of
 * sync.
 */
export const PANEL_COUNT = PROJECTS.length;
export const PANEL_WIDTH = 2.7;
export const PANEL_HEIGHT = 1.62;
export const PANEL_DEPTH = 0.07;
/** Center-to-center distance between consecutive panels along x, in the
 *  track's own local space (panel i sits at local x = i * SPACING). */
export const SPACING = 4.4;
export const TOTAL_SPAN = (PANEL_COUNT - 1) * SPACING;
/**
 * Extra local-space travel reserved before panel 0 so the track doesn't
 * start with a panel already sitting dead center. At progress 0 the track
 * is offset so panel 0 sits ENTRY_PADDING world units to the (camera's)
 * right — enough to already be partly onscreen, sliding in, the instant the
 * section's pin engages, rather than scrolling through empty corridor
 * first.
 *
 * There's no matching padding after the last panel: progress 1 is defined
 * (via TRACK_LENGTH below) to land exactly when the last panel is centered,
 * so the pin releases into Services' normal scroll right then instead of
 * leaving extra empty corridor to scroll through first.
 */
export const ENTRY_PADDING = SPACING * 0.55;
/** Total local-space distance the track slides across the full 0->1 pin. */
export const TRACK_LENGTH = TOTAL_SPAN + ENTRY_PADDING;

/**
 * The track group's world-x offset for a given scroll progress (0..1).
 * Panel i, at local x = i*SPACING, therefore sits at world x =
 * i*SPACING + trackOffsetX(progress) — 0 when it's dead center in front of
 * the (fixed) camera, positive to the camera's right, negative to its left.
 */
export function trackOffsetX(progress: number) {
  return ENTRY_PADDING - progress * TRACK_LENGTH;
}

/** How far (in local x) a panel can sit from dead-center and still count as
 *  at least partly "in focus" — shared by ProjectPanel (its own scale/tilt/
 *  caption falloff) and PanelGlow (its focus-boosted brightness) so the two
 *  agree on when a panel reads as "the one in front of you". */
export const FOCUS_WINDOW = SPACING * 0.85;

/**
 * The gallery opens on the hero's own paper tone (continuing it, not
 * cutting to something else) and fades to a dark "exhibition space" once
 * the pin has actually engaged — GalleryBackdrop animates the WebGL scene's
 * background/fog between these, and Projects.tsx's HUD chrome (label,
 * counter, progress rail) crossfades its own colors in step, both driven by
 * the same ENTRY_FADE_FRACTION so the two stay in sync.
 */
export const SCENE_PAPER = "#f5f3ee";
export const SCENE_DARK = "#0d0d0d";
/** Fraction of the pin's scroll progress over which that fade completes. */
export const ENTRY_FADE_FRACTION = 0.08;

export interface PanelLayout {
  position: THREE.Vector3;
  /** Resting (fully off-focus) tilt. ProjectPanel eases this toward 0 as
   *  the panel nears center, so every panel — regardless of which side of
   *  the serpentine it's on — reads as exactly parallel to the camera at
   *  the same moment: when it's centered, not at some rotation baked in
   *  ahead of time that would only look "straight" by coincidence. */
  rotationY: number;
}

/**
 * Every panel sits at the same y and z — deliberately. An earlier version
 * gave each one its own small serpentine y/z jitter for depth variety, but
 * with a fixed camera (see GalleryTrack's comment) that meant each panel
 * was a different distance from the camera — and therefore a different
 * apparent size, sometimes cropped top/bottom — at the exact moment it was
 * centered, instead of every panel getting the same, predictable framing.
 * Depth/side variety now comes only from `rotationY` (the serpentine tilt,
 * which eases to 0 right as a panel centers, so it never affects centered
 * framing) and from GalleryEnvironment's particles/studs/grid.
 */
export function panelLayout(i: number): PanelLayout {
  const side = i % 2 === 0 ? 1 : -1;
  return {
    position: new THREE.Vector3(i * SPACING, 0, 0),
    rotationY: -side * 0.16,
  };
}
