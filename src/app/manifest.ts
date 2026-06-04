import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OdontoClinic",
    short_name: "OdontoClinic",
    description: "Gestão de consultório odontológico",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0d9488",
  };
}
