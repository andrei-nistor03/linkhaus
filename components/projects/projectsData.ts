export interface Project {
  index: string;
  title: string;
  description: string;
  tags: string[];
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

export const PROJECTS: Project[] = [
  {
    index: "01",
    title: "Utopia",
    description:
      "Website for Utopia Fried Chicken, a bold red-and-yellow fast-food brand. A full menu with category filters (burgers, wings, buckets, deals) and a store locator, designed mobile-first.",
    tags: ["WEB", "BRAND"],
    accent: "#e30613",
    year: "2026",
    thumbnail: "/assets/utopia-thumbnail-1920x1080.webp",
    video: "/assets/utopia-portfolio-final-1080p.mp4",
    thumbnailMobile: "/assets/utopia-thumbnail-mobile.webp",
    videoMobile: "/assets/utopia-portfolio-final-mobile.mp4",
  },
  {
    index: "02",
    title: "eCandidat",
    description:
      "Full-stack recruitment platform for eCandidat, built with Next.js, React and Node.js. Candidates build one profile and jobs come to them; companies post roles and get smart-matched candidates instead of mass applications.",
    tags: ["WEB", "PRODUCT"],
    accent: "#2b4bff",
    year: "2026",
    thumbnail: "/assets/ecandidat-thumbnail.webp",
    video: "/assets/ecandidat-portfolio.mp4",
    thumbnailMobile: "/assets/ecandidat-thumbnail-mobile.webp",
    videoMobile: "/assets/ecandidat-portfolio-mobile.mp4",
  },
  {
    index: "03",
    title: "Cuib d'Arte",
    description:
      "Concept website for Cuib d'Arte, an art bar where art meets drinks and stories. It has a hand-crafted paper-and-typewriter look, an events feed, table reservations and a bilingual RO/EN interface.",
    tags: ["WEB", "CONCEPT"],
    accent: "#a52a24",
    year: "2026",
    thumbnail: "/assets/cuib-darte-thumbnail.webp",
    video: "/assets/cuib-darte-portfolio.mp4",
    thumbnailMobile: "/assets/cuib-darte-thumbnail-mobile.webp",
    videoMobile: "/assets/cuib-darte-portfolio-mobile.mp4",
  },
  {
    index: "04",
    title: "Nocturne",
    description:
      "Concept website for Nocturne Cocktail Club. A \"what do you feel like tonight?\" flavour picker recommends cocktails, alongside cinematic motion, 3D product shots and table reservations.",
    tags: ["WEB", "CONCEPT"],
    accent: "#c9a45c",
    year: "2026",
    thumbnail: "/assets/Nocturne_Thumbnail_Devices.webp",
    video: "/assets/Nocturne_Portfolio.mp4",
    thumbnailMobile: "/assets/Nocturne_Thumbnail_Devices-mobile.webp",
    videoMobile: "/assets/Nocturne_Portfolio-mobile.mp4",
  },
];
