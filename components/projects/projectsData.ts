// Locale-independent project data. Titles, descriptions and tags live in the
// dictionaries (lib/i18n/dictionaries), listed in the same order as here.
export interface ProjectMeta {
  index: string;
  accent: string;
  year: string;
  // Paths under /public. The thumbnail covers the panel face; the video
  // crossfades in over it on hover (desktop) or when centered (touch).
  thumbnail?: string;
  video?: string;
  // Lighter 960px / 480p versions used by the phone (vertical) layout.
  thumbnailMobile?: string;
  videoMobile?: string;
}

export interface ProjectCopy {
  title: string;
  description: string;
  tags: string[];
}

export type Project = ProjectMeta & ProjectCopy;

export const PROJECT_META: ProjectMeta[] = [
  {
    index: "01",
    accent: "#e30613",
    year: "2026",
    thumbnail: "/assets/utopia-thumbnail-1920x1080.webp",
    video: "/assets/utopia-portfolio-final-1080p.mp4",
    thumbnailMobile: "/assets/utopia-thumbnail-mobile.webp",
    videoMobile: "/assets/utopia-portfolio-final-mobile.mp4",
  },
  {
    index: "02",
    accent: "#2b4bff",
    year: "2026",
    thumbnail: "/assets/ecandidat-thumbnail.webp",
    video: "/assets/ecandidat-portfolio.mp4",
    thumbnailMobile: "/assets/ecandidat-thumbnail-mobile.webp",
    videoMobile: "/assets/ecandidat-portfolio-mobile.mp4",
  },
  {
    index: "03",
    accent: "#a52a24",
    year: "2026",
    thumbnail: "/assets/cuib-darte-thumbnail.webp",
    video: "/assets/cuib-darte-portfolio.mp4",
    thumbnailMobile: "/assets/cuib-darte-thumbnail-mobile.webp",
    videoMobile: "/assets/cuib-darte-portfolio-mobile.mp4",
  },
  {
    index: "04",
    accent: "#c9a45c",
    year: "2026",
    thumbnail: "/assets/Nocturne_Thumbnail_Devices.webp",
    video: "/assets/Nocturne_Portfolio.mp4",
    thumbnailMobile: "/assets/Nocturne_Thumbnail_Devices-mobile.webp",
    videoMobile: "/assets/Nocturne_Portfolio-mobile.mp4",
  },
];

export function localizeProjects(copy: ProjectCopy[]): Project[] {
  return PROJECT_META.map((meta, i) => ({ ...meta, ...copy[i] }));
}
