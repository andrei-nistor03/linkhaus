export const LOCALES = ["en", "ro"] as const;
export type Locale = (typeof LOCALES)[number];

// English is served unprefixed at `/`; every other locale lives under its own
// prefix (`/ro`). middleware.ts rewrites `/` to the `en` segment internally.
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localePath(locale: Locale) {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  ro: "ro_RO",
};

// hreflang map shared by the page metadata and the sitemap.
export const LANGUAGE_ALTERNATES: Record<string, string> = {
  ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l)])),
  "x-default": localePath(DEFAULT_LOCALE),
};
