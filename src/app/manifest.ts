import type { MetadataRoute } from "next"
import { SITE_NAME_KA } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME_KA} — AI იურიდიული კონსულტაცია`,
    short_name: SITE_NAME_KA,
    description:
      "AI იურისტი — იურიდიული კონსულტაცია, ხელშეკრულების შემოწმება და გენერირება, რისკების ანალიზი ქართულად.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e293b",
    lang: "ka",
    categories: ["legal", "productivity", "business"],
    icons: [
      { src: "/icon", sizes: "any", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}
