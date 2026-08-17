import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MessageCircle, TriangleAlert } from "lucide-react"
import { getLocale } from "@/lib/i18n/locale"
import { PageHero } from "@/components/site/PageHero"
import { JsonLd } from "@/components/site/JsonLd"
import { buildMetadata, breadcrumbJsonLd, enPath, articleJsonLd } from "@/lib/seo"
import { pick, pickArr } from "@/lib/i18n/loc"
import { getGuide } from "@/lib/cms"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuide(slug)
  if (!guide) return {}
  const locale = await getLocale()
  return buildMetadata({
    title: pick(guide.title, guide.titleEn, locale),
    description: pick(guide.description, guide.descriptionEn, locale),
    path: `/guides/${guide.slug}`,
    keywords: pickArr(guide.keywords, guide.keywordsEn, locale),
    type: "article",
    locale,
    bilingual: true,
  })
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className={n > 1 ? "pt-6 border-t border-border" : undefined}>
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = await getGuide(slug)
  if (!guide) notFound()
  const locale = await getLocale()
  const isEn = locale === "en"

  const title = pick(guide.title, guide.titleEn, locale)
  const intro = pick(guide.intro, guide.introEn, locale)
  const dashIndex = title.indexOf(" — ")
  const heroTitle = dashIndex === -1 ? title : title.slice(0, dashIndex)
  const heroSubtitle = dashIndex === -1 ? undefined : title.slice(dashIndex + 3)

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbJsonLd(
            isEn
              ? [
                  { name: "Home", path: enPath("/") },
                  { name: "Guides", path: enPath("/guides") },
                  { name: title, path: enPath(`/guides/${guide.slug}`) },
                ]
              : [
                  { name: "მთავარი", path: "/" },
                  { name: "გზამკვლევები", path: "/guides" },
                  { name: title, path: `/guides/${guide.slug}` },
                ]
          ),
          articleJsonLd({
            title,
            description: pick(guide.description, guide.descriptionEn, locale),
            path: isEn ? enPath(`/guides/${guide.slug}`) : `/guides/${guide.slug}`,
          }),
        ]}
      />
      <PageHero title={heroTitle} subtitle={heroSubtitle} />
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 animate-fade-up delay-150 space-y-6 text-sm leading-relaxed text-foreground/90">
          <p className="text-base text-foreground">{intro}</p>

          {guide.sections.map((section, i) => {
            const sectionTitle = pick(section.title, section.titleEn, locale)
            const paragraphs = pickArr(section.paragraphs, section.paragraphsEn, locale)
            const list = pickArr(section.list ?? [], section.listEn, locale)
            return (
              <Section key={section.title} n={i + 1} title={sectionTitle}>
                {paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {list.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1">
                    {list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </Section>
            )
          })}

          {guide.sources.length > 0 && (
            <div className="pt-6 border-t border-border">
              <h2 className="text-sm font-bold text-foreground mb-2">{isEn ? "Sources" : "წყაროები"}</h2>
              <ul className="space-y-1 text-xs">
                {guide.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {pick(source.label, source.labelEn, locale)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6 border-t border-border flex items-start gap-2 text-xs text-foreground/60">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-gold mt-px" />
            <span>
              {isEn
                ? "This material is a general informational overview, checked against the sources above, and is not legal advice on a specific case. For an answer tailored to your situation, use our AI consultation or contact a lawyer."
                : "ეს მასალა წარმოადგენს ზოგად მიმოხილვას და ეფუძნება მითითებულ საკანონმდებლო წყაროებს. იგი არ არის ინდივიდუალური იურიდიული დასკვნა. კონკრეტული პასუხისთვის გამოიყენეთ AI კონსულტაცია ან მიმართეთ იურისტს."}
            </span>
          </div>
        </div>

        <Link
          href={isEn ? enPath("/chat") : "/chat"}
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-primary/90 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {isEn ? "Ask the AI lawyer for an answer tailored to your case" : "თქვენს შემთხვევაზე მორგებული პასუხისთვის ჰკითხეთ AI იურისტს"}
        </Link>
      </section>
    </div>
  )
}
