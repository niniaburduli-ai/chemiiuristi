import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { HomePage } from "@/lib/models/HomePage"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const doc = await HomePage.findOne().lean()
  return NextResponse.json({ data: doc ?? {} })
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  await dbConnect()
  const doc = await HomePage.findOneAndUpdate({}, { $set: body }, { upsert: true, new: true }).lean()
  return NextResponse.json({ data: doc })
}
