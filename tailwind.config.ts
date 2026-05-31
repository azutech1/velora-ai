import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B1220",
        ink: "#0F172A",
        panel: "#111827",
        mint: "#10B981",
        cyan: "#3B82F6",
        line: "#1F2937",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      boxShadow: {
        neon: "0 18px 48px rgba(59, 130, 246, 0.18)",
        cyan: "0 18px 56px rgba(59, 130, 246, 0.22)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
