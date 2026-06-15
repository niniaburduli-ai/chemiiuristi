import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { AboutPage } from "@/lib/models/AboutPage"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const doc = await AboutPage.findOne().lean()
  return NextResponse.json({ data: doc ?? {} })
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  await dbConnect()
  const doc = await AboutPage.findOneAndUpdate({}, { $set: body }, { upsert: true, new: true }).lean()
  return NextResponse.json({ data: doc })
}
