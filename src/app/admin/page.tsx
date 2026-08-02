import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";

export const metadata: Metadata = { robots: { index: false, follow: false } };
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Upload } from "@/lib/models/upload";
import { Consultation } from "@/lib/models/consultation";
import { GeneratedDocument } from "@/lib/models/generated-document";
import { DocumentReview } from "@/lib/models/document-review";
import { Feedback } from "@/lib/models/Feedback";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/dashboard");

  await dbConnect();

  // Cheap estimated counts only — used for sidebar badges. Row data for each
  // section loads lazily from its own API route the first time that tab is
  // opened (see AdminDashboard), so the initial page load never has to pull
  // every collection (with populated owners) up front.
  const [uploads, users, consultations, generatedDocs, templates, reviews, feedback] =
    await Promise.all([
      Upload.estimatedDocumentCount(),
      User.estimatedDocumentCount(),
      Consultation.estimatedDocumentCount(),
      GeneratedDocument.countDocuments({ source: { $ne: "template" } }),
      GeneratedDocument.countDocuments({ source: "template" }),
      DocumentReview.estimatedDocumentCount(),
      Feedback.estimatedDocumentCount(),
    ]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <AdminDashboard
        currentUserId={session.user.id}
        counts={{ uploads, users, consultations, generatedDocs, templates, reviews, feedback }}
      />
    </div>
  );
}
