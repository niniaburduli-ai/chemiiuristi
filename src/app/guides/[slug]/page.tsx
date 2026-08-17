import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MessageCircle, TriangleAlert } from "lucide-react"
import { PageHero } from "@/components/site/PageHero"
import { JsonLd } from "@/components/site/JsonLd"
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo"
import { GUIDES, getGuide } from "@/lib/guides-content"

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords,
    type: "article",
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
  const guide = getGuide(slug)
  if (!guide) notFound()

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "მთავარი", path: "/" },
            { name: "გზამკვლევები", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
          articleJsonLd({
            title: guide.title,
            description: guide.description,
            path: `/guides/${guide.slug}`,
          }),
        ]}
      />
      <PageHero title={guide.title} />
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 animate-fade-up delay-150 space-y-6 text-sm leading-relaxed text-foreground/90">
          <p className="text-base text-foreground">{guide.intro}</p>

          {guide.sections.map((section, i) => (
            <Section key={section.title} n={i + 1} title={section.title}>
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.list && (
                <ul className="list-disc pl-5 space-y-1">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </Section>
          ))}

          {guide.sources.length > 0 && (
            <div className="pt-6 border-t border-border">
              <h2 className="text-sm font-bold text-foreground mb-2">წყაროები</h2>
              <ul className="space-y-1 text-xs">
                {guide.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6 border-t border-border flex items-start gap-2 text-xs text-foreground/60">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-gold mt-px" />
            <span>
              წინამდებარე მასალა წარმოადგენს ზოგად საინფორმაციო მიმოხილვას, გადამოწმებულს
              ზემოთ მითითებულ წყაროებთან, და არ არის იურიდიული დასკვნა კონკრეტულ საქმეზე.
              თქვენს ვითარებასთან მორგებული პასუხისთვის გამოიყენეთ ჩვენი AI კონსულტაცია ან
              მიმართეთ იურისტს.
            </span>
          </div>
        </div>

        <Link
          href="/chat"
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-primary/90 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          თქვენს შემთხვევაზე მორგებული პასუხისთვის ჰკითხეთ AI იურისტს
        </Link>
      </section>
    </div>
  )
}
