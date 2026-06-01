import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Velora AI",
    short_name: "Velora AI",
    description: "AI-native stablecoin operating system on Arc.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070D",
    theme_color: "#F97316",
    categories: ["finance", "productivity", "utilities"]
  };
}
