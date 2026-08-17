import type { Metadata } from "next"
import { getLocale } from "@/lib/i18n/locale"
import { PageHero } from "@/components/site/PageHero"
import { JsonLd } from "@/components/site/JsonLd"
import { GuidesSearch } from "@/components/site/guides-search"
import { buildMetadata, breadcrumbJsonLd, enPath, KEYWORDS_KA, KEYWORDS_EN } from "@/lib/seo"
import { getGuides } from "@/lib/cms"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const isEn = locale === "en"
  const guides = await getGuides()
  return buildMetadata({
    title: isEn
      ? "Legal Guides — Plain-Language Answers to Common Questions"
      : "იურიდიული გზამკვლევები — მარტივი ახსნა ხშირ საკითხებზე",
    description: isEn
      ? "Practical legal guides on common questions in Georgia — traffic fines, apartment rentals, employment contracts, divorce, and more."
      : "პრაქტიკული სამართლებრივი გზამკვლევები საქართველოში ხშირად წამოჭრილ საკითხებზე — მანქანის ჯარიმები, ბინის ქირავნობა, შრომითი ხელშეკრულება, განქორწინება და სხვა.",
    path: "/guides",
    keywords: isEn
      ? [...guides.flatMap((g) => g.keywordsEn ?? []), ...KEYWORDS_EN]
      : [...guides.flatMap((g) => g.keywords), ...KEYWORDS_KA],
    locale,
    bilingual: true,
  })
}

export default async function GuidesIndexPage() {
  const locale = await getLocale()
  const isEn = locale === "en"
  const guides = await getGuides()
  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd(
          isEn
            ? [
                { name: "Home", path: enPath("/") },
                { name: "Guides", path: enPath("/guides") },
              ]
            : [
                { name: "მთავარი", path: "/" },
                { name: "გზამკვლევები", path: "/guides" },
              ]
        )}
      />
      <PageHero
        title={isEn ? "Legal Guides" : "იურიდიული გზამკვლევები"}
        subtitle={
          isEn
            ? "Common legal questions, explained in plain language"
            : "მარტივ ენაზე ახსნილი, ხშირად წამოჭრილი სამართლებრივი საკითხები"
        }
      />
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <GuidesSearch guides={guides} locale={locale} />
      </section>
    </div>
  )
}
