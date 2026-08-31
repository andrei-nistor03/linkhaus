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
        display: ["var(--font-thunder)", "Helvetica", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
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
