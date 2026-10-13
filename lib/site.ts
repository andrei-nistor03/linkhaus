// Absolute site origin, used for metadataBase (og:image URLs) and the
// JSON-LD schema. Set NEXT_PUBLIC_SITE_URL to the production domain; on
// Vercel the production URL is picked up automatically as a fallback.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "LINKHAUS";
export const SITE_TITLE = "LINKHAUS — Digital Craft & Engineering";
export const SITE_DESCRIPTION =
  "LINKHAUS is a creative technology studio building experimental, art-directed digital experiences at the intersection of design, motion and 3D.";

export const CONTACT_EMAIL = "andreinistorbusiness@gmail.com";
export const CONTACT_PHONE = "+40734236074";
export const SOCIAL_PROFILES = [
  "https://instagram.com/linkhaus.studio",
  "https://github.com/andrei-nistor03",
];
