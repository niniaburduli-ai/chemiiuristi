import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { NavMenu } from "@/lib/models/NavMenu"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const doc = await NavMenu.findOne().lean()
  return NextResponse.json({ data: doc ?? { items: [], status: "draft" } })
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  await dbConnect()
  const doc = await NavMenu.findOneAndUpdate({}, { $set: body }, { upsert: true, new: true }).lean()
  return NextResponse.json({ data: doc })
}
