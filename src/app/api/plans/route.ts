import { NextResponse } from "next/server"
import { getVisiblePlans } from "@/lib/plans-db"
import { getFeatureFlags } from "@/lib/features"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const [plans, flags] = await Promise.all([getVisiblePlans(), getFeatureFlags()])
  return NextResponse.json({ plans, flags })
}
