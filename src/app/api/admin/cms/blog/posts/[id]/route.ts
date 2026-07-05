import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { BlogPost } from "@/lib/models/BlogPost"

export const runtime = "nodejs"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  await dbConnect()
  const doc = await BlogPost.findById(id).lean()
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: doc })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  if (body.status === "published" && !body.publishedAt) body.publishedAt = new Date()
  await dbConnect()
  const doc = await BlogPost.findByIdAndUpdate(id, { $set: body }, { returnDocument: "after" }).lean()
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: doc })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  await dbConnect()
  await BlogPost.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
}
