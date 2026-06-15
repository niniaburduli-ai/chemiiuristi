import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { LegalNotice } from "@/lib/models/LegalNotice"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const items = await LegalNotice.find().sort({ type: 1 }).lean()
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  if (!body.type) return NextResponse.json({ error: "type required" }, { status: 400 })
  await dbConnect()
  const doc = await LegalNotice.findOneAndUpdate(
    { type: body.type },
    { $set: body },
    { upsert: true, new: true }
  ).lean()
  return NextResponse.json({ data: doc }, { status: 201 })
}
