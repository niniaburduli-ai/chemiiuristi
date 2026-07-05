import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { FAQ } from "@/lib/models/FAQ"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()
  const doc = await FAQ.findOne().lean()
  return NextResponse.json({ data: doc ?? { items: [] } })
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  await dbConnect()
  const doc = await FAQ.findOneAndUpdate({}, { $set: { items: body.items } }, { upsert: true, returnDocument: "after" }).lean()
  revalidatePath("/")
  return NextResponse.json({ data: doc })
}
