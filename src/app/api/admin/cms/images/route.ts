import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { destroyAsset } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { publicId } = await req.json()
  if (!publicId) return NextResponse.json({ error: "publicId required" }, { status: 400 })
  await destroyAsset(publicId)
  return NextResponse.json({ ok: true })
}
