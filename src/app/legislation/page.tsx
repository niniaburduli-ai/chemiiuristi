import { getLocale } from "@/lib/i18n/locale"
import { getDict } from "@/lib/i18n/dictionaries"
import { PageHero } from "@/components/site/PageHero"
import { LegislationClient } from "./legislation-client"

export default async function LegislationPage() {
  const locale = await getLocale()
  const d = getDict(locale)
  return (
    <div>
      <PageHero title={d.legislation.title} subtitle={d.legislation.subtitle} />
      <LegislationClient locale={locale} />
    </div>
  )
}
