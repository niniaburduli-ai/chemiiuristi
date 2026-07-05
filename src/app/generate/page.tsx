import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFeatureFlags } from "@/lib/features";
import { GenerateClient } from "./generate-client";

type Props = { searchParams: Promise<{ type?: string }> };

export default async function GeneratePage({ searchParams }: Props) {
  const [session, flags, { type }] = await Promise.all([auth(), getFeatureFlags(), searchParams]);
  if (!flags.generate) redirect("/");
  if (!session?.user?.id) redirect("/login?callbackUrl=/generate");
  return <GenerateClient initialType={type} />;
}
