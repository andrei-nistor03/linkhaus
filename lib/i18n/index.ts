import type { Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { ro } from "./dictionaries/ro";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ro };

// Server-side lookup. Client components get the active dictionary through
// I18nProvider instead, so only the current locale's copy ships to the browser.
export function getDictionary(locale: Locale) {
  return DICTIONARIES[locale];
}

export type { Dictionary };
