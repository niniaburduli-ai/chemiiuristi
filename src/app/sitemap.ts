import type { MetadataRoute } from "next"
import { SITE_URL, PUBLIC_ROUTES, enPath } from "@/lib/seo"
import { getGuides } from "@/lib/cms"

/**
 * Public, indexable routes only. Auth-gated pages (dashboard, chat, generate,
 * review, billing, profile, admin, auth) are intentionally excluded — they are
 * also disallowed in robots.ts. Route list (incl. which ones are bilingual)
 * lives in lib/seo.ts so this stays in sync with middleware.ts's /en rewriting.
 *
 * /guides/<slug> entries are added dynamically below from the database (see
 * lib/cms.ts getGuides) so a guide the admin publishes shows up here without
 * a code change.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries = PUBLIC_ROUTES.flatMap((r) => {
    const kaEntry: MetadataRoute.Sitemap[number] = {
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      ...(r.bilingual
        ? { alternates: { languages: { ka: `${SITE_URL}${r.path}`, en: `${SITE_URL}${enPath(r.path)}` } } }
        : {}),
    }
    if (!r.bilingual) return [kaEntry]

    const enEntry: MetadataRoute.Sitemap[number] = {
      url: `${SITE_URL}${enPath(r.path)}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: { languages: { ka: `${SITE_URL}${r.path}`, en: `${SITE_URL}${enPath(r.path)}` } },
    }
    return [kaEntry, enEntry]
  })

  const guides = await getGuides()
  const guideEntries = guides.flatMap((g): MetadataRoute.Sitemap => {
    const path = `/guides/${g.slug}`
    const languages = { ka: `${SITE_URL}${path}`, en: `${SITE_URL}${enPath(path)}` }
    return [
      { url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: "monthly", priority: 0.7, alternates: { languages } },
      { url: `${SITE_URL}${enPath(path)}`, lastModified: now, changeFrequency: "monthly", priority: 0.7, alternates: { languages } },
    ]
  })

  return [...staticEntries, ...guideEntries]
}
