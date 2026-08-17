import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { Guides } from "@/lib/models/Guides"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const doc = await Guides.findOne().lean()
  return NextResponse.json({ data: doc ?? { items: [] } })
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  await dbConnect()
  const doc = await Guides.findOneAndUpdate({}, { $set: { items: body.items } }, { upsert: true, returnDocument: "after" }).lean()
  revalidatePath("/guides")
  return NextResponse.json({ data: doc })
}
