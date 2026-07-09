import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = { width: 48, height: 48 }
export const contentType = "image/png"

// Favicon / tab icon: gold monogram on dark brand background.
export default async function Icon() {
  const bold = await readFile(join(process.cwd(), "src/app/_og/NotoSansGeorgian-700.ttf"))
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#c9a227",
          fontSize: 34,
          fontWeight: 700,
          fontFamily: "Noto",
          borderRadius: 8,
        }}
      >
        ჩ
      </div>
    ),
    { ...size, fonts: [{ name: "Noto", data: bold, weight: 700, style: "normal" }] }
  )
}
