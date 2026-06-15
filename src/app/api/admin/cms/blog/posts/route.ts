import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { BlogPost } from "@/lib/models/BlogPost"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const items = await BlogPost.find().sort({ createdAt: -1 }).limit(200).lean()
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  if (!body.title || !body.slug) return NextResponse.json({ error: "title and slug required" }, { status: 400 })
  await dbConnect()
  const doc = await BlogPost.create(body)
  return NextResponse.json({ data: doc }, { status: 201 })
}
