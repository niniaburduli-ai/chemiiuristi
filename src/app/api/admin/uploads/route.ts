import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { dbConnect } from "@/lib/db";
import { Upload } from "@/lib/models/upload";
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
  const filter = await buildSearchFilter(q, ["originalName", "publicId", "note"], "userId");
  const [items, total] = await Promise.all([
    Upload.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", model: User, select: "name email" })
      .lean(),
    Upload.countDocuments(filter),
  ]);

  return NextResponse.json({
    total,
    items: items.map((u) => {
      const owner = u.userId as unknown as { _id: unknown; name?: string; email?: string } | null;
      return {
        id: String((u as { _id: unknown })._id),
        url: u.url,
        publicId: u.publicId,
        bytes: u.bytes,
        format: u.format ?? null,
        resourceType: u.resourceType,
        originalName: u.originalName ?? null,
        note: u.note ?? "",
        createdAt: (u as { createdAt?: Date }).createdAt ?? null,
        owner: owner
          ? { id: String(owner._id), name: owner.name ?? null, email: owner.email ?? null }
          : null,
      };
    }),
  });
}
