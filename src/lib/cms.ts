import { dbConnect } from "@/lib/db"
import { SiteConfig } from "@/lib/models/SiteConfig"
import { NavMenu } from "@/lib/models/NavMenu"
import { HomePage } from "@/lib/models/HomePage"
import { AboutPage } from "@/lib/models/AboutPage"
import { FAQ } from "@/lib/models/FAQ"
import { FooterContent } from "@/lib/models/FooterContent"
import { LegalNotice } from "@/lib/models/LegalNotice"
import { BlogPost } from "@/lib/models/BlogPost"
import type {
  SiteConfigData, NavMenuData, HomePageData, AboutPageData,
  FAQData, FooterData, LegalNoticeData, LegalNoticeType, BlogPostData,
} from "@/types/cms"

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_SITE_CONFIG: SiteConfigData = {
  logoUrl: "", logoPubId: "", siteName: "ჩემი იურისტი", tagline: "",
  favicon: "", contactEmail: "", contactPhone: "", contactAddress: "", socialLinks: {},
}

const DEFAULT_NAV: NavMenuData = {
  items: [
    { _id: "1", label: "მთავარი", href: "/", order: 0, isExternal: false },
    { _id: "2", label: "ჩვენ შესახებ", href: "/about", order: 1, isExternal: false },
    { _id: "3", label: "მომსახურებები", href: "/#services", order: 2, isExternal: false },
    { _id: "4", label: "ბლოგი", href: "/blog", order: 3, isExternal: false },
    { _id: "5", label: "კანონმდებლობა", href: "/legislation", order: 4, isExternal: false },
  ],
  status: "published",
}

const DEFAULT_FOOTER: FooterData = {
  columns: [], disclaimer: "ეს სერვისი არ წარმოადგენს იურიდიულ კონსულტაციას.", copyright: `© ${new Date().getFullYear()} ჩემი იურისტი`, status: "published",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPlain<T>(doc: T): T {
  if (!doc) return doc
  const obj = JSON.parse(JSON.stringify(doc)) as T
  return obj
}

// ─── Public Getters ───────────────────────────────────────────────────────────

export async function getSiteConfig(): Promise<SiteConfigData> {
  try {
    await dbConnect()
    const doc = await SiteConfig.findOne().lean()
    if (!doc) return DEFAULT_SITE_CONFIG
    return toPlain({
      logoUrl: doc.logoUrl, logoPubId: doc.logoPubId, siteName: doc.siteName,
      tagline: doc.tagline, favicon: doc.favicon, contactEmail: doc.contactEmail,
      contactPhone: doc.contactPhone, contactAddress: doc.contactAddress,
      socialLinks: doc.socialLinks ?? {},
    })
  } catch { return DEFAULT_SITE_CONFIG }
}

export async function getNavMenu(): Promise<NavMenuData> {
  try {
    await dbConnect()
    const doc = await NavMenu.findOne({ status: "published" }).lean()
    if (!doc) return DEFAULT_NAV
    return toPlain({
      items: doc.items.map((i) => ({
        _id: String(i._id), label: i.label, href: i.href, order: i.order, isExternal: i.isExternal,
      })).sort((a, b) => a.order - b.order),
      status: doc.status as "published",
    })
  } catch { return DEFAULT_NAV }
}

export async function getHomePage(): Promise<HomePageData | null> {
  try {
    await dbConnect()
    const doc = await HomePage.findOne({ status: "published" }).lean()
    if (!doc) return null
    return toPlain(doc as unknown as HomePageData)
  } catch { return null }
}

export async function getAboutPage(): Promise<AboutPageData | null> {
  try {
    await dbConnect()
    const doc = await AboutPage.findOne({ status: "published" }).lean()
    if (!doc) return null
    return toPlain(doc as unknown as AboutPageData)
  } catch { return null }
}

export async function getFAQ(): Promise<FAQData> {
  try {
    await dbConnect()
    const doc = await FAQ.findOne().lean()
    if (!doc) return { items: [] }
    return toPlain({
      items: doc.items
        .filter((i) => i.status === "published")
        .sort((a, b) => a.order - b.order)
        .map((i) => ({ _id: String(i._id), question: i.question, answer: i.answer, category: i.category, order: i.order, status: i.status as import("@/types/cms").CMSStatus })),
    })
  } catch { return { items: [] } }
}

export async function getFooter(): Promise<FooterData> {
  try {
    await dbConnect()
    const doc = await FooterContent.findOne({ status: "published" }).lean()
    if (!doc) return DEFAULT_FOOTER
    return toPlain(doc as unknown as FooterData)
  } catch { return DEFAULT_FOOTER }
}

export async function getLegalNotice(type: LegalNoticeType): Promise<LegalNoticeData | null> {
  try {
    await dbConnect()
    const doc = await LegalNotice.findOne({ type, status: "published" }).lean()
    if (!doc) return null
    return toPlain({
      _id: String(doc._id), type: doc.type as import("@/types/cms").LegalNoticeType, title: doc.title, body: doc.body,
      status: doc.status as import("@/types/cms").CMSStatus, publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    }) as LegalNoticeData
  } catch { return null }
}

export async function getPublishedBlogPosts(limit = 20): Promise<BlogPostData[]> {
  try {
    await dbConnect()
    const docs = await BlogPost.find({ status: "published" })
      .sort({ publishedAt: -1 }).limit(limit).lean()
    return toPlain(docs.map((d) => ({
      _id: String(d._id), title: d.title, slug: d.slug, body: d.body,
      excerpt: d.excerpt, coverImageUrl: d.coverImageUrl, coverImagePubId: d.coverImagePubId,
      category: String(d.category), tags: d.tags, author: d.author, status: d.status as import("@/types/cms").CMSStatus,
      publishedAt: d.publishedAt ? d.publishedAt.toISOString() : null,
      createdAt: (d as { createdAt?: Date }).createdAt?.toISOString() ?? "",
    })))
  } catch { return [] }
}

export async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  try {
    await dbConnect()
    const doc = await BlogPost.findOne({ slug, status: "published" }).lean()
    if (!doc) return null
    return toPlain({
      _id: String(doc._id), title: doc.title, slug: doc.slug, body: doc.body,
      excerpt: doc.excerpt, coverImageUrl: doc.coverImageUrl, coverImagePubId: doc.coverImagePubId,
      category: String(doc.category), tags: doc.tags, author: doc.author, status: doc.status as import("@/types/cms").CMSStatus,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
      createdAt: (doc as { createdAt?: Date }).createdAt?.toISOString() ?? "",
    }) as BlogPostData
  } catch { return null }
}
