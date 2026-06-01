import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#05070D",
        ink: "#0A0D14",
        panel: "#10141D",
        mint: "#10B981",
        cyan: "#F97316",
        line: "#252A35",
        warning: "#F59E0B",
        danger: "#FF2D3D"
      },
      boxShadow: {
        neon: "0 18px 42px rgba(249, 115, 22, 0.18)",
        cyan: "0 18px 48px rgba(255, 45, 61, 0.18)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
