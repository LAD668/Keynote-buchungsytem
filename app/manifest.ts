import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dänk Symposium",
    short_name: "Dänk",
    description: "Workshop booking system for Dänk Symposium",
    start_url: "/login",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5B6FE5",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
