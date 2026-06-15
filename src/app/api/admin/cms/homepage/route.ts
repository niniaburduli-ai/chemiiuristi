import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getAdminSession } from "@/lib/admin"
import { dbConnect } from "@/lib/db"
import { HomePage } from "@/lib/models/HomePage"
import { HOME_SEED } from "@/lib/homepage-defaults"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await dbConnect()

  const raw = await HomePage.findOne().lean() as Record<string, unknown> | null

  if (!raw) {
    const created = await HomePage.create({ ...HOME_SEED, status: "draft" })
    return NextResponse.json({ data: created.toObject() })
  }

  // Backfill new fields that didn't exist in previous schema versions
  const data = {
    ...raw,
    sections: (raw.sections as object | undefined) ?? HOME_SEED.sections,
    serviceCards: (raw.serviceCards as unknown[] | undefined)?.length
      ? raw.serviceCards
      : HOME_SEED.serviceCards,
    statsHeading: (raw.statsHeading as string | undefined) || HOME_SEED.statsHeading,
    stats: (raw.stats as unknown[] | undefined)?.length
      ? raw.stats
      : HOME_SEED.stats,
    featuresHeading: (raw.featuresHeading as string | undefined) || HOME_SEED.featuresHeading,
    pricingHeading: (raw.pricingHeading as string | undefined) || HOME_SEED.pricingHeading,
    plans: (raw.plans as unknown[] | undefined)?.length
      ? raw.plans
      : HOME_SEED.plans,
  }

  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  await dbConnect()
  const doc = await HomePage.findOneAndUpdate({}, { $set: body }, { upsert: true, new: true }).lean()
  revalidatePath("/")
  return NextResponse.json({ data: doc })
}
