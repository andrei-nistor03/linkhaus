export interface Project {
  index: string;
  title: string;
  tags: string[];
  accent: string;
  year: string;
  // Paths under /public. The thumbnail covers the panel face; the video
  // crossfades in over it on hover (desktop) or when centered (touch).
  thumbnail?: string;
  video?: string;
}

export const PROJECTS: Project[] = [
  {
    index: "01",
    title: "Utopia",
    tags: ["WEB", "BRAND"],
    accent: "#e30613",
    year: "2026",
    thumbnail: "/assets/utopia-thumbnail-1920x1080.webp",
    video: "/assets/utopia-portfolio-final-1080p.mp4",
  },
  {
    index: "02",
    title: "eCandidat",
    tags: ["WEB", "PRODUCT"],
    accent: "#2b4bff",
    year: "2026",
    thumbnail: "/assets/ecandidat-thumbnail.webp",
    video: "/assets/ecandidat-portfolio.mp4",
  },
  {
    index: "03",
    title: "Cuib d'Arte",
    tags: ["WEB", "CONCEPT"],
    accent: "#a52a24",
    year: "2026",
    thumbnail: "/assets/cuib-darte-thumbnail.webp",
    video: "/assets/cuib-darte-portfolio.mp4",
  },
  {
    index: "04",
    title: "Nocturne",
    tags: ["WEB", "CONCEPT"],
    accent: "#c9a45c",
    year: "2026",
    thumbnail: "/assets/Nocturne_Thumbnail_Devices.webp",
    video: "/assets/Nocturne_Portfolio.mp4",
  },
];
