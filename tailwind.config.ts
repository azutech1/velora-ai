import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#050816",
        ink: "#0A0F1C",
        panel: "#111827",
        mint: "#00F5C4",
        cyan: "#00C2FF"
      },
      boxShadow: {
        neon: "0 0 32px rgba(0, 245, 196, 0.28)",
        cyan: "0 0 42px rgba(0, 194, 255, 0.24)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
