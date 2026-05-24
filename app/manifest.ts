import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Velora AI",
    short_name: "Velora AI",
    description: "AI-native stablecoin operating system on Arc.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0F1C",
    theme_color: "#00F5C4",
    categories: ["finance", "productivity", "utilities"]
  };
}
