import type { Metadata } from "next"
import { getLocale } from "@/lib/i18n/locale"
import { getDict } from "@/lib/i18n/dictionaries"
import { PageHero } from "@/components/site/PageHero"
import { LegislationClient } from "./legislation-client"
import { JsonLd } from "@/components/site/JsonLd"
import { buildMetadata, breadcrumbJsonLd, KEYWORDS_KA } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "კანონმდებლობა — რისი უფლება მაქვს, მანქანის ჯარიმები",
  description:
    "საქართველოს კანონმდებლობა მარტივ ენაზე: რისი უფლება მაქვს, მანქანის ჯარიმები, სამართლებრივი რჩევები და იურიდიული კონსულტაცია AI იურისტისგან.",
  path: "/legislation",
  keywords: [
    "კანონმდებლობა",
    "საქართველოს კანონმდებლობა",
    "რისი უფლება მაქვს",
    "მანქანის ჯარიმები",
    "სამართლებრივი რჩევა",
    ...KEYWORDS_KA,
  ],
})

export default async function LegislationPage() {
  const locale = await getLocale()
  const d = getDict(locale)
  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "მთავარი", path: "/" },
          { name: "კანონმდებლობა", path: "/legislation" },
        ])}
      />
      <PageHero title={d.legislation.title} subtitle={d.legislation.subtitle} />
      <LegislationClient locale={locale} />
    </div>
  )
}
