import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export default function manifest(): MetadataRoute.Manifest {
  const { meta } = getDictionary(DEFAULT_LOCALE);
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: meta.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ee",
    theme_color: "#f5f3ee",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
