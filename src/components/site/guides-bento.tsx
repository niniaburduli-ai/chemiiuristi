import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AnimateIn } from "@/components/site/AnimateIn"
import type { GuideItem } from "@/types/cms"
import type { Locale } from "@/lib/i18n/config"
import { pick } from "@/lib/i18n/loc"
import { enPath } from "@/lib/seo"

// Compact 2-row bento, explicitly placed so it tiles with zero gaps and stays
// short (matches the pricing section's scale) instead of growing tall:
//   row1: [ hero — 3 cols wide           ] [ tall, spans both rows ]
//   row2: [ wide — 2 cols ] [ small — 1 col ] [ tall continues      ]
const SHAPES = [
  {
    grid: "sm:col-span-2 lg:col-start-1 lg:col-span-3 lg:row-start-1 lg:row-span-1",
    layout: "row" as const,
    title: "text-base md:text-lg",
    desc: "text-sm line-clamp-3",
  },
  {
    grid: "sm:col-span-1 lg:col-start-4 lg:col-span-1 lg:row-start-1 lg:row-span-2",
    layout: "col" as const,
    title: "text-base",
    desc: "text-sm leading-relaxed line-clamp-[9]",
  },
  {
    grid: "sm:col-span-1 lg:col-start-1 lg:col-span-2 lg:row-start-2 lg:row-span-1",
    layout: "row" as const,
    title: "text-sm md:text-base",
    desc: "text-sm line-clamp-2",
  },
  {
    grid: "sm:col-span-1 lg:col-start-3 lg:col-span-1 lg:row-start-2 lg:row-span-1",
    layout: "col" as const,
    title: "text-sm",
    desc: "text-xs line-clamp-3",
  },
]

export function GuidesBentoSection({
  guides,
  locale,
  heading,
  viewAllLabel,
}: {
  guides: GuideItem[]
  locale: Locale
  heading: string
  viewAllLabel: string
}) {
  const isEn = locale === "en"
  const items = guides.slice(0, SHAPES.length)
  if (items.length === 0) return null

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-14">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{heading}</h2>
          <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-primary to-gold mx-auto mt-4 mb-6" />
          <Link
            href={isEn ? enPath("/guides") : "/guides"}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl px-6 py-3 hover:bg-primary/90 transition-colors btn-hover"
          >
            {viewAllLabel}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[150px] gap-4">
          {items.map((guide, idx) => {
            const shape = SHAPES[idx]
            const title = pick(guide.title, guide.titleEn, locale)
            const description = pick(guide.description, guide.descriptionEn, locale)
            const href = isEn ? enPath(`/guides/${guide.slug}`) : `/guides/${guide.slug}`
            const isRow = shape.layout === "row"
            const cta = (
              <span className="inline-flex items-center gap-1.5 shrink-0 text-xs md:text-sm font-semibold text-primary dark:text-gold">
                {isEn ? "Read more" : "დეტალურად"}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            )
            return (
              <AnimateIn key={guide._id} delay={idx * 60} className={shape.grid}>
                <Link
                  href={href}
                  className={`group h-full min-h-[140px] overflow-hidden bg-card border border-border rounded-2xl p-4 hover:border-primary/50 hover:shadow-lg transition-all card-hover flex ${
                    isRow ? "flex-row items-center justify-between gap-4" : "flex-col"
                  }`}
                >
                  <div className="min-w-0">
                    <h3 className={`font-bold text-foreground group-hover:text-primary dark:group-hover:text-gold transition-colors ${shape.title}`}>
                      {title}
                    </h3>
                    <p className={`text-foreground/70 mt-1 leading-snug ${shape.desc}`}>{description}</p>
                    {!isRow && <div className="mt-2">{cta}</div>}
                  </div>
                  {isRow && cta}
                </Link>
              </AnimateIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
