import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaxiNum",
    short_name: "TaxiNum",
    description:
      "Perfil QR para que taxistas muestren su numero de transferencia.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#10B981",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
