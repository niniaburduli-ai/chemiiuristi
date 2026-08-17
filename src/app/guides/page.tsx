import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHero } from "@/components/site/PageHero"
import { JsonLd } from "@/components/site/JsonLd"
import { buildMetadata, breadcrumbJsonLd, KEYWORDS_KA } from "@/lib/seo"
import { GUIDES } from "@/lib/guides-content"

export const metadata: Metadata = buildMetadata({
  title: "იურიდიული გზამკვლევები — მარტივი ახსნა ხშირ საკითხებზე",
  description:
    "პრაქტიკული სამართლებრივი გზამკვლევები საქართველოში ხშირად წამოჭრილ საკითხებზე — მანქანის ჯარიმები, ბინის ქირავნობა, შრომითი ხელშეკრულება, განქორწინება და სხვა.",
  path: "/guides",
  keywords: [...GUIDES.flatMap((g) => g.keywords), ...KEYWORDS_KA],
})

export default function GuidesIndexPage() {
  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "მთავარი", path: "/" },
          { name: "გზამკვლევები", path: "/guides" },
        ])}
      />
      <PageHero
        title="იურიდიული გზამკვლევები"
        subtitle="მარტივ ენაზე ახსნილი, ხშირად წამოჭრილი სამართლებრივი საკითხები"
      />
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <div className="grid gap-4">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group bg-card border border-border rounded-2xl p-6 flex items-start justify-between gap-4 hover:border-primary/50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {guide.title}
                </h2>
                <p className="text-sm text-foreground/70 mt-1.5 leading-relaxed">{guide.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
