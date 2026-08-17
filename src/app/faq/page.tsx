import type { Metadata } from "next"
import { getFAQ } from "@/lib/cms"
import { getLocale } from "@/lib/i18n/locale"
import { pick } from "@/lib/i18n/loc"
import { getHomeSeed } from "@/lib/homepage-defaults"
import { PageHero } from "@/components/site/PageHero"
import { JsonLd } from "@/components/site/JsonLd"
import { FaqSearch } from "@/components/site/faq-search"
import { buildMetadata, breadcrumbJsonLd, faqJsonLd, KEYWORDS_KA, KEYWORDS_EN } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const isEn = locale === "en"
  return buildMetadata({
    title: isEn ? "FAQ — AI Legal Consultation" : "ხშირად დასმული კითხვები — AI იურიდიული კონსულტაცია",
    description: isEn
      ? "Answers to frequently asked questions about Chemi Iuristi — AI consultation, plans, and subscriptions."
      : "პასუხები ხშირად დასმულ კითხვებზე „ჩემი იურისტი“-ს შესახებ — AI კონსულტაცია, პაკეტები და გამოწერა.",
    path: "/faq",
    keywords: isEn
      ? ["legal consultation FAQ", "how does AI lawyer work", "legal advice questions", ...KEYWORDS_EN]
      : ["ხშირად დასმული კითხვები", "იურიდიული კონსულტაცია როგორ მუშაობს", "AI იურისტის კითხვები", ...KEYWORDS_KA],
    locale,
    bilingual: true,
  })
}

export const dynamic = "force-dynamic"

export default async function FaqPage() {
  const locale = await getLocale()
  const seed = getHomeSeed()
  const faqData = await getFAQ(locale)
  const heading = pick(seed.faqHeading, seed.faqHeadingEn, locale)
  const subtitle =
    locale === "en"
      ? "Find the answer to your question, or write to us via the feedback button or email"
      : "მოძებნეთ თქვენთვის საჭირო კითხვაზე პასუხი ან მოგვწერეთ გამოხმაურების ღილაკის და მეილის საშუალებით"

  const breadcrumbs = breadcrumbJsonLd([
    { name: locale === "en" ? "Home" : "მთავარი", path: locale === "en" ? "/en" : "/" },
    { name: heading, path: locale === "en" ? "/en/faq" : "/faq" },
  ])

  return (
    <div>
      <JsonLd data={breadcrumbs} />
      <PageHero title={heading} subtitle={subtitle} />

      {faqData.items.length > 0 && (
        <section className="bg-background overflow-hidden">
          <JsonLd data={faqJsonLd(faqData.items.map((i) => ({ q: i.question, a: i.answer })))} />
          <div className="container mx-auto px-4 py-14">
            <FaqSearch items={faqData.items} locale={locale} />
          </div>
        </section>
      )}
    </div>
  )
}
