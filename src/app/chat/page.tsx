import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// /chat was an older, standalone consultation UI that predates the
// /services?tab=ai panel and had drifted out of sync with it (no bounded
// scroll box, plainer layout). Rather than keep two chat UIs in sync,
// send everyone to the one panel.
export default function ChatPage() {
  redirect("/services?tab=ai");
}
