import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { dbConnect } from "@/lib/db";
import { Feedback } from "@/lib/models/Feedback";
import { buildSearchFilter } from "@/lib/admin-search";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));
  const skip = Math.max(0, Number(sp.get("skip")) || 0);
  const q = sp.get("q")?.trim();

  await dbConnect();
  const filter = await buildSearchFilter(q, ["userEmail", "message"]);
  const [items, total] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Feedback.countDocuments(filter),
  ]);

  return NextResponse.json({
    total,
    items: items.map((f) => ({
      id: String((f as { _id: unknown })._id),
      rating: f.rating ?? null,
      message: f.message ?? "",
      isApproved: f.isApproved ?? false,
      userEmail: f.userEmail ?? null,
      createdAt: (f as { createdAt?: Date }).createdAt?.toISOString() ?? null,
    })),
  });
}
