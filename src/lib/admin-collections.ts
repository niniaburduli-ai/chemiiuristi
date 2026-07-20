import type { Model } from "mongoose"
import { User } from "@/lib/models/user"
import { Consultation } from "@/lib/models/consultation"
import { GeneratedDocument } from "@/lib/models/generated-document"
import { DocumentReview } from "@/lib/models/document-review"
import { Upload } from "@/lib/models/upload"
import { Plan } from "@/lib/models/Plan"
import { Payment } from "@/lib/models/payment"
import { Subscription } from "@/lib/models/subscription"
import { SiteConfig } from "@/lib/models/SiteConfig"
import { NavMenu } from "@/lib/models/NavMenu"
import { HomePage } from "@/lib/models/HomePage"
import { AboutPage } from "@/lib/models/AboutPage"
import { FAQ } from "@/lib/models/FAQ"
import { FooterContent } from "@/lib/models/FooterContent"
import { LegalNotice } from "@/lib/models/LegalNotice"
import { BlogPost } from "@/lib/models/BlogPost"
import { BlogCategory } from "@/lib/models/BlogCategory"
import { ThemeConfig } from "@/lib/models/ThemeConfig"
import { FeatureFlags } from "@/lib/models/FeatureFlags"
import { EmailLog } from "@/lib/models/EmailLog"
import { Feedback } from "@/lib/models/Feedback"

export type AdminCollection = {
  slug: string
  label: string
  /** Georgian label shown alongside the English one in the admin picker. */
  labelKa: string
  model: Model<unknown>
  /** Fields never returned to the client nor writable from the editor. */
  hidden: string[]
}

/**
 * Safelist of collections the generic DB explorer can read/write. Anything not
 * here is inaccessible. `hidden` fields (secrets) are stripped on read and
 * rejected on write.
 */
export const ADMIN_COLLECTIONS: AdminCollection[] = [
  { slug: "users", label: "Users", labelKa: "მომხმარებლები", model: User as unknown as Model<unknown>, hidden: ["passwordHash"] },
  { slug: "plans", label: "Plans", labelKa: "გეგმები", model: Plan as unknown as Model<unknown>, hidden: [] },
  { slug: "consultations", label: "Consultations", labelKa: "კონსულტაციები", model: Consultation as unknown as Model<unknown>, hidden: [] },
  { slug: "generated-documents", label: "Generated Documents", labelKa: "დაგენერირებული დოკუმენტები", model: GeneratedDocument as unknown as Model<unknown>, hidden: [] },
  { slug: "document-reviews", label: "Document Reviews", labelKa: "დოკუმენტების მიმოხილვები", model: DocumentReview as unknown as Model<unknown>, hidden: [] },
  { slug: "uploads", label: "Uploads", labelKa: "ატვირთვები", model: Upload as unknown as Model<unknown>, hidden: [] },
  { slug: "payments", label: "Payments", labelKa: "გადახდები", model: Payment as unknown as Model<unknown>, hidden: [] },
  { slug: "subscriptions", label: "Subscriptions", labelKa: "გამოწერები", model: Subscription as unknown as Model<unknown>, hidden: [] },
  { slug: "site-config", label: "Site Config", labelKa: "საიტის კონფიგურაცია", model: SiteConfig as unknown as Model<unknown>, hidden: [] },
  { slug: "nav-menus", label: "Nav Menus", labelKa: "ნავიგაციის მენიუები", model: NavMenu as unknown as Model<unknown>, hidden: [] },
  { slug: "home-pages", label: "Home Pages", labelKa: "მთავარი გვერდები", model: HomePage as unknown as Model<unknown>, hidden: [] },
  { slug: "about-pages", label: "About Pages", labelKa: "გვერდი ჩვენ შესახებ", model: AboutPage as unknown as Model<unknown>, hidden: [] },
  { slug: "faqs", label: "FAQ", labelKa: "ხშირად დასმული კითხვები", model: FAQ as unknown as Model<unknown>, hidden: [] },
  { slug: "footers", label: "Footers", labelKa: "ქვედა კოლონტიტულები", model: FooterContent as unknown as Model<unknown>, hidden: [] },
  { slug: "legal-notices", label: "Legal Notices", labelKa: "სამართლებრივი შეტყობინებები", model: LegalNotice as unknown as Model<unknown>, hidden: [] },
  { slug: "blog-posts", label: "Blog Posts", labelKa: "ბლოგის სტატიები", model: BlogPost as unknown as Model<unknown>, hidden: [] },
  { slug: "blog-categories", label: "Blog Categories", labelKa: "ბლოგის კატეგორიები", model: BlogCategory as unknown as Model<unknown>, hidden: [] },
  { slug: "theme-config", label: "Theme Config", labelKa: "თემის კონფიგურაცია", model: ThemeConfig as unknown as Model<unknown>, hidden: [] },
  { slug: "feature-flags", label: "Feature Flags", labelKa: "ფუნქციების ალმები", model: FeatureFlags as unknown as Model<unknown>, hidden: [] },
  { slug: "email-log", label: "Correspondence", labelKa: "მიმოწერა", model: EmailLog as unknown as Model<unknown>, hidden: [] },
  { slug: "feedback", label: "Feedback", labelKa: "მომხმარებლის გამოხმაურება", model: Feedback as unknown as Model<unknown>, hidden: [] },
]

export function getCollection(slug: string): AdminCollection | null {
  return ADMIN_COLLECTIONS.find((c) => c.slug === slug) ?? null
}

/** Remove hidden + system-write fields from an inbound document. */
export function sanitizeWrite(
  body: Record<string, unknown>,
  hidden: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const block = new Set(["_id", "__v", "createdAt", "updatedAt", ...hidden])
  for (const [k, v] of Object.entries(body)) {
    if (!block.has(k)) out[k] = v
  }
  return out
}

/** Strip hidden fields from a doc read out of the DB. */
export function stripHidden<T extends Record<string, unknown>>(doc: T, hidden: string[]): T {
  if (!hidden.length) return doc
  const clone = { ...doc }
  for (const h of hidden) delete clone[h]
  return clone
}
