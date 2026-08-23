import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f5f3ee",
        surface: "#ffffff",
        ink: "#0d0d0d",
        muted: "#6f6c66",
        line: "#dedad0",
        accent: {
          blue: "#2b4bff",
          acid: "#c8ff4d",
          orange: "#ff5a1f",
          violet: "#8a5cff",
        },
      },
      fontFamily: {
        grotesk: ["var(--font-grotesk)", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        // System Helvetica stack (no webfont — Helvetica itself isn't
        // licensable for the web) for the hero copy specifically, per
        // request. Falls through to Helvetica Neue, then Arial, which are
        // metric-compatible on every platform that lacks true Helvetica.
        helvetica: ["Helvetica", "Helvetica Neue", "Arial", "sans-serif"],
        // Thunder (HC): the display face for the hero title/subtitle.
        display: ["var(--font-thunder)", "Helvetica", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        "fluid-hero": "clamp(3.2rem, 10vw, 9.5rem)",
        "fluid-h1": "clamp(2.4rem, 6vw, 5.5rem)",
        "fluid-h2": "clamp(1.8rem, 4vw, 3.4rem)",
      },
      letterSpacing: {
        tightest: "-0.06em",
      },
      transitionTimingFunction: {
        art: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
