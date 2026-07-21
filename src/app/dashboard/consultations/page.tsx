import { redirect } from "next/navigation";

export default function ConsultationsRedirectPage() {
  redirect("/dashboard?tab=consultations");
}
