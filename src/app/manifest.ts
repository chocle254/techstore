import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JonWin Clean",
    short_name: "JonWin",
    description: "JonWin Clean shop and business manager",
    start_url: "/admin",
    display: "standalone",
    background_color: "#f6f8f7",
    theme_color: "#0b8a6b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
