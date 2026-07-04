import { redirect } from "next/navigation";

// The document analysis flow now lives exclusively in DocumentAnalysisModal,
// opened from the homepage and dashboard — this page is kept only so old
// links/bookmarks land somewhere sane instead of a stale, unmaintained UI.
export default function ReviewPage() {
  redirect("/dashboard");
}
