import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { dbConnect } from "@/lib/db";
import { Consultation } from "@/lib/models/consultation";
import { User } from "@/lib/models/user";
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
  const filter = await buildSearchFilter(q, ["question", "answer"], "userId");
  const [items, total] = await Promise.all([
    Consultation.find(filter)
      .select("userId question answer modelTier costUsd createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", model: User, select: "name email" })
      .lean(),
    Consultation.countDocuments(filter),
  ]);

  return NextResponse.json({
    total,
    items: items.map((c) => {
      const owner = c.userId as unknown as { name?: string; email?: string } | null;
      return {
        id: String((c as { _id: unknown })._id),
        question: c.question,
        answer: c.answer,
        modelTier: c.modelTier ?? null,
        costUsd: c.costUsd ?? 0,
        createdAt: (c as { createdAt?: Date }).createdAt?.toISOString() ?? null,
        owner: owner ? { name: owner.name ?? null, email: owner.email ?? null } : null,
      };
    }),
  });
}
