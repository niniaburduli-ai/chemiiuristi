import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { BlogCategory } from "@/lib/models/BlogCategory"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const items = await BlogCategory.find().sort({ name: 1 }).lean()
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  if (!body.name || !body.slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 })
  await dbConnect()
  const doc = await BlogCategory.create(body)
  return NextResponse.json({ data: doc }, { status: 201 })
}
