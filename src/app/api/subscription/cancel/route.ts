import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { stopSubscription } from "@/lib/flitt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!user.flittOrderId || user.plan === "free") {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  let stopped = false;
  try {
    stopped = await stopSubscription(user.flittOrderId);
  } catch {
    stopped = false;
  }

  // Mark cancelled locally regardless — the plan keeps its quota until resetAt.
  user.set({ subscriptionStatus: "canceled" });
  await user.save();

  return NextResponse.json({ ok: true, stopped });
}
