import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

export const grotesk = Space_Grotesk({
  // latin-ext carries Romanian ă ș ț.
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-grotesk",
  display: "swap",
});

export const mono = JetBrains_Mono({
  // latin-ext carries Romanian ă ș ț.
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const thunder = localFont({
  src: "./fonts/thunder-vf.ttf",
  variable: "--font-thunder",
  display: "swap",
  weight: "100 900",
});
