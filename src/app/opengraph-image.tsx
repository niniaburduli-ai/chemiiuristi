import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "ჩემი იურისტი — AI იურიდიული კონსულტაცია ქართულად"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Site-wide OpenGraph/Twitter card. Statically generated at build time.
export default async function Image() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "src/app/_og/NotoSansGeorgian-400.ttf")),
    readFile(join(process.cwd(), "src/app/_og/NotoSansGeorgian-700.ttf")),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
          color: "#ffffff",
          fontFamily: "Noto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#c9a227",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            ჩ
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>ჩემი იურისტი</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 940 }}>
            AI იურიდიული კონსულტაცია ქართულად
          </div>
          <div style={{ fontSize: 34, color: "#c9a227", fontWeight: 700 }}>
            ხელშეკრულების შემოწმება · გენერირება · რისკების ანალიზი
          </div>
        </div>

        <div style={{ fontSize: 28, color: "#cbd5e1" }}>
          იურიდიული რჩევები საქართველოს კანონმდებლობის საფუძველზე
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto", data: regular, weight: 400, style: "normal" },
        { name: "Noto", data: bold, weight: 700, style: "normal" },
      ],
    }
  )
}
