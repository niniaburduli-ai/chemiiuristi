import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AnimateIn } from "@/components/site/AnimateIn"
import type { GuideItem } from "@/types/cms"
import type { Locale } from "@/lib/i18n/config"
import { pick } from "@/lib/i18n/loc"
import { enPath } from "@/lib/seo"

// Zero-gap asymmetric tiling on a 3-col / 2-row-unit grid: big(2x2) + tall(1x2)
// fully cover rows 1-2 (3 cols x 2 rows = 6 cells); wide(2x1) + small(1x1) fully
// cover row 3 (3 cells); banner(3x1) alone fills row 4. Every card a different shape.
const SHAPES = [
  { span: "sm:col-span-2 lg:col-span-2 lg:row-span-2", title: "text-xl md:text-2xl", desc: "text-sm md:text-base line-clamp-3", banner: false },
  { span: "sm:col-span-1 lg:col-span-1 lg:row-span-2", title: "text-lg", desc: "text-sm line-clamp-4", banner: false },
  { span: "sm:col-span-2 lg:col-span-2 lg:row-span-1", title: "text-base", desc: "text-sm line-clamp-2", banner: false },
  { span: "sm:col-span-1 lg:col-span-1 lg:row-span-1", title: "text-base", desc: "text-sm line-clamp-2", banner: false },
  { span: "sm:col-span-2 lg:col-span-3 lg:row-span-1", title: "text-lg", desc: "text-sm line-clamp-2", banner: true },
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
  const items = guides.slice(0, 5)
  if (items.length === 0) return null

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{heading}</h2>
          <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-primary to-gold mx-auto mt-4 mb-6" />
          <Link
            href={isEn ? enPath("/guides") : "/guides"}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl px-6 py-3 hover:bg-primary/90 transition-colors btn-hover"
          >
            {viewAllLabel}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[210px] lg:grid-flow-row-dense gap-5">
          {items.map((guide, idx) => {
            const shape = SHAPES[idx] ?? SHAPES[3]
            const title = pick(guide.title, guide.titleEn, locale)
            const description = pick(guide.description, guide.descriptionEn, locale)
            const href = isEn ? enPath(`/guides/${guide.slug}`) : `/guides/${guide.slug}`
            const cta = (
              <span className="inline-flex items-center gap-1.5 shrink-0 text-sm font-semibold text-primary">
                {isEn ? "Read more" : "დეტალურად"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )
            return (
              <AnimateIn key={guide._id} delay={idx * 60} className={shape.span}>
                <Link
                  href={href}
                  className={`group h-full min-h-[180px] overflow-hidden bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all card-hover flex ${
                    shape.banner ? "flex-row items-center justify-between gap-6" : "flex-col"
                  }`}
                >
                  <div className={shape.banner ? "min-w-0" : ""}>
                    <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors ${shape.title}`}>
                      {title}
                    </h3>
                    <p className={`text-foreground/70 mt-2 leading-relaxed ${shape.desc}`}>{description}</p>
                    {!shape.banner && <div className="mt-4">{cta}</div>}
                  </div>
                  {shape.banner && cta}
                </Link>
              </AnimateIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
