import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// Apple touch icon — same Themis artwork as icon.png, full bleed (Apple rounds corners itself).
export default async function AppleIcon() {
  const png = await readFile(join(process.cwd(), "src/app/icon.png"))
  const src = `data:image/png;base64,${png.toString("base64")}`
  return new ImageResponse(<img src={src} width={size.width} height={size.height} />, size)
}
