export const dynamic = "force-dynamic"

import { getFeatureFlags } from "@/lib/features"
import { getLocale } from "@/lib/i18n/locale"
import { getVisiblePlans } from "@/lib/plans-db"
import { ServicesPageClient } from "./services-client"

export default async function ServicesPage() {
  const [locale, flags, plans] = await Promise.all([getLocale(), getFeatureFlags(), getVisiblePlans()])
  const upgradePlan =
    plans.find((p) => p.highlighted && p.active) ?? plans.find((p) => !p.isFree && p.active) ?? null
  return <ServicesPageClient locale={locale} flags={flags} upgradePlan={upgradePlan} />
}
