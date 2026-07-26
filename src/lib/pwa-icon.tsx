import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

// Shared renderer for the installable-PWA icons referenced from manifest.ts.
// `maskable` keeps the artwork inside the inner ~66% safe zone so Android's
// adaptive-icon mask never clips it; the navy background bleeds to the edges.
export async function renderPwaIcon(size: number, opts: { maskable?: boolean } = {}) {
  const png = await readFile(join(process.cwd(), "src/app/icon.png"))
  const src = `data:image/png;base64,${png.toString("base64")}`
  const inner = Math.round(size * (opts.maskable ? 0.66 : 1))

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
        }}
      >
        <img src={src} width={inner} height={inner} />
      </div>
    ),
    { width: size, height: size }
  )
}
