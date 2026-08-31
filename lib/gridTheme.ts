/**
 * Shared "technical grid" palette — the drafting-table motif that runs
 * through both the gallery's WebGL floor (GalleryEnvironment's drei
 * `<Grid>`) and Services' CSS backdrop grid (ServicesBackdrop). Centralized
 * here for the same reason galleryLayout.ts centralizes SCENE_PAPER/
 * SCENE_DARK for GalleryBackdrop + Projects.tsx: two renderers (three.js
 * material props vs. CSS background-image) can't share a literal DOM node,
 * but keeping them on the same constants is what makes the motif read as
 * one continuing grid across the gallery→Services handoff rather than two
 * unrelated ones that happen to both be grids.
 *
 * GRID_MAJOR_RATIO mirrors the gallery grid's own sectionSize/cellSize
 * ratio (2.2 / 0.55 = 4) — every 4th line reads as a heavier "section"
 * line in both renderers, not just a uniform mesh.
 */
export const GRID_LINE_COLOR = "#dedad0";
export const GRID_MAJOR_COLOR = "#c9c4b6";
export const GRID_MAJOR_RATIO = 4;

/** `#rrggbb` -> `rgba(r, g, b, alpha)`, for CSS layers that need the shared
 *  hex constants above at a specific opacity (three.js color props take the
 *  hex directly and have no need for this). */
export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
