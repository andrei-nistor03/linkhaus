/**
 * Placeholder work for the 3D showcase (components/sections/Projects.tsx +
 * components/three/Gallery*). `accent` picks one of tailwind.config.ts's
 * `accent.*` colors, which PanelMaterial.ts reads directly (as a THREE.Color
 * hex) to duotone-tint each panel's animated halftone shader — swap these
 * for real names/covers/links when actual case studies exist.
 */
export interface Project {
  index: string;
  title: string;
  tags: string[];
  accent: string;
  year: string;
}

export const PROJECTS: Project[] = [
  { index: "01", title: "Nordhouse", tags: ["WEB", "3D", "MOTION"], accent: "#8a5cff", year: "2025" },
  { index: "02", title: "Vantage OS", tags: ["PRODUCT", "UI"], accent: "#2b4bff", year: "2025" },
  { index: "03", title: "Fieldnote", tags: ["BRAND", "WEB"], accent: "#ff5a1f", year: "2024" },
  { index: "04", title: "Halogen", tags: ["3D", "WEBGL"], accent: "#8a5cff", year: "2024" },
  { index: "05", title: "Origami Bank", tags: ["PRODUCT", "MOTION"], accent: "#c8ff4d", year: "2024" },
  { index: "06", title: "Studio Ume", tags: ["WEB", "BRAND"], accent: "#2b4bff", year: "2023" },
];
