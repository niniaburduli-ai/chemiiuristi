import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Consultation } from "@/lib/models/consultation";
import { GeneratedDocument } from "@/lib/models/generated-document";
import { DocumentReview } from "@/lib/models/document-review";
import { buildSearchFilter } from "@/lib/admin-search";

export const runtime = "nodejs";

type CostBucket = { _id: string; total: number };

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
  const filter = await buildSearchFilter(q, ["name", "email", "role", "plan"]);
  const [items, total, consultationCosts, docCosts, reviewCosts] = await Promise.all([
    User.find(filter)
      .select(
        "name email image role plan consultationsRemaining docGenerationRemaining docReviewRemaining docTemplatesRemaining planExpiresAt createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
    Consultation.aggregate<CostBucket>([
      { $group: { _id: "$userId", total: { $sum: "$costUsd" } } },
    ]),
    GeneratedDocument.aggregate<CostBucket>([
      { $group: { _id: "$userId", total: { $sum: "$costUsd" } } },
    ]),
    DocumentReview.aggregate<CostBucket>([
      { $group: { _id: "$userId", total: { $sum: "$costUsd" } } },
    ]),
  ]);

  const costByUser = new Map<string, number>();
  for (const bucket of [...consultationCosts, ...docCosts, ...reviewCosts]) {
    const key = String(bucket._id);
    costByUser.set(key, (costByUser.get(key) ?? 0) + bucket.total);
  }

  return NextResponse.json({
    total,
    items: items.map((u) => {
      const id = String((u as { _id: unknown })._id);
      return {
        id,
        name: u.name,
        email: u.email,
        image: u.image ?? null,
        role: u.role ?? "user",
        plan: u.plan ?? "free",
        consultationsRemaining: u.consultationsRemaining ?? 0,
        docGenerationRemaining: u.docGenerationRemaining ?? 0,
        docReviewRemaining: u.docReviewRemaining ?? 0,
        docTemplatesRemaining: u.docTemplatesRemaining ?? 0,
        planExpiresAt: u.planExpiresAt ? new Date(u.planExpiresAt).toISOString() : null,
        createdAt: (u as { createdAt?: Date }).createdAt?.toISOString() ?? null,
        totalAiCostUsd: costByUser.get(id) ?? 0,
      };
    }),
  });
}
