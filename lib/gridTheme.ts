export const GRID_LINE_COLOR = "#dedad0";
export const GRID_MAJOR_COLOR = "#c9c4b6";
export const GRID_MAJOR_RATIO = 4;

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
