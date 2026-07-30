import type { Metadata } from "next"
import { getFAQ } from "@/lib/cms"
import { getLocale } from "@/lib/i18n/locale"
import { pick } from "@/lib/i18n/loc"
import { getHomeSeed } from "@/lib/homepage-defaults"
import { PageHero } from "@/components/site/PageHero"
import { JsonLd } from "@/components/site/JsonLd"
import { buildMetadata, faqJsonLd, KEYWORDS_KA, KEYWORDS_EN } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const isEn = locale === "en"
  return buildMetadata({
    title: isEn ? "FAQ — AI Legal Consultation" : "ხშირად დასმული კითხვები — AI იურიდიული კონსულტაცია",
    description: isEn
      ? "Answers to frequently asked questions about Chemi Iuristi — AI consultation, plans, and subscriptions."
      : "პასუხები ხშირად დასმულ კითხვებზე „ჩემი იურისტი“-ს შესახებ — AI კონსულტაცია, პაკეტები და გამოწერა.",
    path: "/faq",
    keywords: isEn ? [...KEYWORDS_EN] : [...KEYWORDS_KA],
    locale,
    bilingual: true,
  })
}

export const dynamic = "force-dynamic"

/** Groups already-order-sorted items by category, keeping each category's first-seen order. */
function groupByCategory<T extends { category: string }>(items: T[]) {
  const groups: { category: string; items: T[] }[] = []
  for (const item of items) {
    const key = item.category || ""
    let group = groups.find((g) => g.category === key)
    if (!group) {
      group = { category: key, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

export default async function FaqPage() {
  const locale = await getLocale()
  const seed = getHomeSeed()
  const faqData = await getFAQ(locale)
  const heading = pick(seed.faqHeading, seed.faqHeadingEn, locale)
  const groups = groupByCategory(faqData.items)
  const subtitle =
    locale === "en"
      ? "Find the answer to your question, or write to us via the feedback button or email"
      : "მოძებნეთ თქვენთვის საჭირო კითხვაზე პასუხი ან მოგვწერეთ გამოხმაურების ღილაკის და მეილის საშუალებით"

  return (
    <div>
      <PageHero title={heading} subtitle={subtitle} />

      {faqData.items.length > 0 && (
        <section className="bg-background overflow-hidden">
          <JsonLd data={faqJsonLd(faqData.items.map((i) => ({ q: i.question, a: i.answer })))} />
          <div className="container mx-auto px-4 py-14 space-y-12">
            {groups.map((group) => (
              <div key={group.category || "uncategorized"} className="max-w-3xl mx-auto">
                {group.category && (
                  <div className="mb-6 text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">{group.category}</h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-primary to-gold mt-3 mx-auto rounded-full" />
                  </div>
                )}
                <div className="space-y-4">
                  {group.items.map((f) => (
                    <div key={f._id} className="bg-card border border-border rounded-2xl p-6 md:p-7 text-center">
                      <p className="font-bold text-foreground mb-2">{f.question}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line text-justify">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
