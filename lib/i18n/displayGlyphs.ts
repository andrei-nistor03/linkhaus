// Thunder (the display face) has no comma-below ș/ț, only the older cedilla
// forms ş/ţ. Text set in Thunder goes through this so Romanian headings don't
// fall back to a different font mid-word.
const CEDILLA: Record<string, string> = {
  "ș": "ş",
  "ț": "ţ",
  "Ș": "Ş",
  "Ț": "Ţ",
};

export function toDisplayGlyphs(text: string) {
  return text.replace(/[șțȘȚ]/g, (c) => CEDILLA[c]);
}
