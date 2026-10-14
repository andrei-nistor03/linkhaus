import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { LANGUAGE_ALTERNATES, LOCALES, localePath } from "@/lib/i18n/config";

const languages = Object.fromEntries(
  Object.entries(LANGUAGE_ALTERNATES).map(([lang, path]) => [lang, `${SITE_URL}${path}`]),
);

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}${localePath(locale)}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
    alternates: { languages },
  }));
}
