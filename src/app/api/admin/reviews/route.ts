import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { dbConnect } from "@/lib/db";
import { DocumentReview } from "@/lib/models/document-review";
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
  const filter = await buildSearchFilter(q, ["fileName", "summary"], "userId");
  const [items, total] = await Promise.all([
    DocumentReview.find(filter)
      .select("userId fileName summary findings recommendations costUsd createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", model: User, select: "name email" })
      .lean(),
    DocumentReview.countDocuments(filter),
  ]);

  return NextResponse.json({
    total,
    items: items.map((r) => {
      const owner = r.userId as unknown as { name?: string; email?: string } | null;
      return {
        id: String((r as { _id: unknown })._id),
        fileName: r.fileName ?? "document",
        summary: r.summary,
        findingsCount: (r.findings ?? []).length,
        recommendationsCount: (r.recommendations ?? []).length,
        costUsd: r.costUsd ?? 0,
        createdAt: (r as { createdAt?: Date }).createdAt?.toISOString() ?? null,
        owner: owner ? { name: owner.name ?? null, email: owner.email ?? null } : null,
      };
    }),
  });
}
