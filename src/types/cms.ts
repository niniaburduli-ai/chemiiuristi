export type CMSStatus = "draft" | "published" | "hidden"
export type LegalNoticeType = "ai-warning" | "terms" | "privacy" | "cookie"

export interface SiteConfigData {
  logoUrl: string
  logoPubId: string
  siteName: string
  tagline: string
  favicon: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  socialLinks: { facebook?: string; twitter?: string; linkedin?: string; youtube?: string }
}

export interface NavItem {
  _id: string
  label: string
  href: string
  order: number
  isExternal: boolean
}
export interface NavMenuData { items: NavItem[]; status: CMSStatus }

export interface HomePageData {
  hero: { title: string; subtitle: string; ctaText: string; ctaHref: string; imageUrl: string; imagePubId: string }
  stats: Array<{ label: string; value: string }>
  features: Array<{ _id: string; title: string; body: string; icon: string; order: number }>
  services: Array<{ _id: string; title: string; description: string; href: string; icon: string; order: number }>
  ctaSection: { title: string; subtitle: string; buttonText: string; buttonHref: string }
  status: CMSStatus
}

export interface AboutPageData {
  title: string
  body: object
  mission: string
  team: Array<{ _id: string; name: string; role: string; imageUrl: string; imagePubId: string; order: number }>
  status: CMSStatus
}

export interface FAQItem {
  _id: string
  question: string
  answer: string
  category: string
  order: number
  status: CMSStatus
}
export interface FAQData { items: FAQItem[] }

export interface BlogCategoryData {
  _id: string
  name: string
  slug: string
  description: string
  status: CMSStatus
}

export interface BlogPostData {
  _id: string
  title: string
  slug: string
  body: object
  excerpt: string
  coverImageUrl: string
  coverImagePubId: string
  category: string
  tags: string[]
  author: string
  status: CMSStatus
  publishedAt: string | null
  createdAt: string
}

export interface FooterColumn {
  _id: string
  heading: string
  links: Array<{ label: string; href: string }>
  order: number
}
export interface FooterData {
  columns: FooterColumn[]
  disclaimer: string
  copyright: string
  status: CMSStatus
}

export interface LegalNoticeData {
  _id: string
  type: LegalNoticeType
  title: string
  body: object
  status: CMSStatus
  publishedAt: string | null
}
