import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { GeneratedDocument } from "@/lib/models/generated-document";
import { DocumentReview } from "@/lib/models/document-review";
import {
  DocumentsClient,
  type SerializedDoc,
  type SerializedReview,
} from "./documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/documents");

  await dbConnect();
  const [rawDocs, rawReviews] = await Promise.all([
    GeneratedDocument.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    DocumentReview.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ]);

  const docs: SerializedDoc[] = rawDocs.map((d) => ({
    id: String((d as { _id: unknown })._id),
    title: d.title,
    type: d.type,
    content: d.content,
    createdAt: (d as { createdAt?: Date }).createdAt?.toISOString() ?? null,
  }));

  const reviews: SerializedReview[] = rawReviews.map((r) => ({
    id: String((r as { _id: unknown })._id),
    fileName: r.fileName ?? "document",
    summary: r.summary,
    findings: r.findings ?? [],
    recommendations: r.recommendations ?? [],
    riskScore:
      typeof (r as { riskScore?: unknown }).riskScore === "number"
        ? (r as { riskScore: number }).riskScore
        : null,
    createdAt: (r as { createdAt?: Date }).createdAt?.toISOString() ?? null,
  }));

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <p className="text-muted-foreground text-sm">იტვირთება...</p>
        </div>
      }
    >
      <DocumentsClient docs={docs} reviews={reviews} />
    </Suspense>
  );
}
