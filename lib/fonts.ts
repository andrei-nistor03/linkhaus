import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

export const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Thunder — variable cut: the display face for the hero title and subtitle
// only. Self-hosted (not a Google Font) — file lives in ./fonts. Replaces
// the single static LC (low-contrast) cut with the variable font, which
// exposes `wght` (100–900) plus Thunder's two custom axes, `CNTR`
// (contrast, low↔high strokes) and `ital`. Loading it as one variable file
// rather than picking another static instance lets the title be pushed to
// max weight *and* max contrast at once (a combination no static cut
// ships) via `font-variation-settings` at the call site — see Hero.tsx.
export const thunder = localFont({
  src: "./fonts/thunder-vf.ttf",
  variable: "--font-thunder",
  display: "swap",
  weight: "100 900",
});
