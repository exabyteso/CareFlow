import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CareFlow",
    short_name: "CareFlow",
    description:
      "Kenya pretriage routing to a suitable facility. This is not a diagnosis.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f8fb",
    theme_color: "#1e63b8",
    lang: "en",
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
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Care-seeker",
        short_name: "Care-seeker",
        description: "Open the care-seeker pretriage shell",
        url: "/patient",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Hospital desk",
        short_name: "Hospital desk",
        description: "Open the hospital desk for this facility",
        url: "/hospital",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
