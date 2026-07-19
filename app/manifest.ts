import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "圃場管理アプリ",
    short_name: "圃場管理",
    description: "圃場と作業記録を管理するフィールドマネジメントアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#0071e3",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
