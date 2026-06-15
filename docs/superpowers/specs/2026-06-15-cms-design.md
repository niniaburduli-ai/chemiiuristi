# CMS Design Spec — Admin Panel Content Management System

**Date:** 2026-06-15  
**Status:** Approved  
**Stack decisions:** MongoDB (Mongoose), TipTap rich text, Cloudinary (existing), Draft→Publish workflow

---

## 1. Overview

A fully integrated CMS inside the existing Admin Panel, enabling non-technical administrators to manage all website content without editing code. Content is stored in MongoDB, served via typed getter functions with hardcoded fallbacks, and edited through dedicated form UIs per content domain.

---

## 2. Data Layer — Mongoose Models

All models live in `src/lib/models/`. All models include:
- `createdAt: Date`
- `updatedAt: Date` (auto via `{ timestamps: true }`)
- `status: "draft" | "published" | "hidden"` where applicable

### 2.1 SiteConfig (singleton)
```ts
{
  logoUrl: string,         // Cloudinary URL
  logoPubId: string,       // Cloudinary public_id for deletion
  siteName: string,        // "ჩემი იურისტი"
  tagline: string,
  favicon: string,         // Cloudinary URL
  contactEmail: string,
  contactPhone: string,
  contactAddress: string,
  socialLinks: {
    facebook?: string,
    twitter?: string,
    linkedin?: string,
    youtube?: string,
  }
}
```
Singleton — always one document. Created with defaults on first access.

### 2.2 NavMenu (singleton)
```ts
{
  items: Array<{
    _id: ObjectId,
    label: string,          // Georgian label
    href: string,
    order: number,
    isExternal: boolean,
  }>,
  status: "draft" | "published"
}
```

### 2.3 HomePage (singleton)
```ts
{
  hero: {
    title: string,
    subtitle: string,
    ctaText: string,
    ctaHref: string,
    imageUrl?: string,
    imagePubId?: string,
  },
  stats: Array<{ label: string, value: string }>,   // max 4
  features: Array<{
    _id: ObjectId,
    title: string,
    body: string,
    icon: string,           // lucide icon name
    order: number,
  }>,
  services: Array<{
    _id: ObjectId,
    title: string,
    description: string,
    href: string,
    icon: string,
    order: number,
  }>,
  ctaSection: {
    title: string,
    subtitle: string,
    buttonText: string,
    buttonHref: string,
  },
  status: "draft" | "published"
}
```

### 2.4 AboutPage (singleton)
```ts
{
  title: string,
  body: object,              // TipTap JSON (ProseMirror doc)
  mission: string,           // plain text
  team: Array<{
    _id: ObjectId,
    name: string,
    role: string,
    imageUrl?: string,
    imagePubId?: string,
    order: number,
  }>,
  status: "draft" | "published"
}
```

### 2.5 FAQ (singleton with items array)
```ts
{
  items: Array<{
    _id: ObjectId,
    question: string,
    answer: string,          // plain text (no rich text for FAQ)
    category: string,
    order: number,
    status: "draft" | "published" | "hidden",
  }>
}
```

### 2.6 BlogPost (multi-document)
```ts
{
  title: string,
  slug: string,              // unique, auto-generated from title
  body: object,              // TipTap JSON
  excerpt: string,
  coverImageUrl?: string,
  coverImagePubId?: string,
  category: ObjectId,        // ref: BlogCategory
  tags: string[],
  author: string,            // free text (admin name)
  status: "draft" | "published" | "hidden",
  publishedAt?: Date,        // set when status → published
}
```

### 2.7 BlogCategory (multi-document)
```ts
{
  name: string,
  slug: string,              // unique
  description: string,
  status: "draft" | "published" | "hidden",
}
```

### 2.8 FooterContent (singleton)
```ts
{
  columns: Array<{
    _id: ObjectId,
    heading: string,
    links: Array<{ label: string, href: string }>,
    order: number,
  }>,
  disclaimer: string,        // AI/legal disclaimer text
  copyright: string,         // "© 2025 ჩემი იურისტი"
  status: "draft" | "published"
}
```

### 2.9 LegalNotice (multi-document, typed)
```ts
{
  type: "ai-warning" | "terms" | "privacy" | "cookie",
  title: string,
  body: object,              // TipTap JSON
  status: "draft" | "published" | "hidden",
  publishedAt?: Date,
}
```
One document per `type` (upsert pattern).

---

## 3. API Layer

All routes under `src/app/api/admin/cms/`. Every route:
1. Calls `getAdminSession()` — redirects/401 if not admin
2. Validates body with Zod schema
3. Returns `{ data, error }` JSON shape

| Route | Methods | Description |
|---|---|---|
| `/api/admin/cms/site-config` | GET, PUT | Singleton site config |
| `/api/admin/cms/nav` | GET, PUT | Full nav menu (all items) |
| `/api/admin/cms/homepage` | GET, PUT | Singleton homepage |
| `/api/admin/cms/about` | GET, PUT | Singleton about page |
| `/api/admin/cms/faq` | GET, PUT | Full FAQ (all items) |
| `/api/admin/cms/blog/posts` | GET, POST | List / create posts |
| `/api/admin/cms/blog/posts/[id]` | GET, PATCH, DELETE | Single post |
| `/api/admin/cms/blog/categories` | GET, POST | List / create categories |
| `/api/admin/cms/blog/categories/[id]` | PATCH, DELETE | Single category |
| `/api/admin/cms/footer` | GET, PUT | Singleton footer |
| `/api/admin/cms/legal` | GET, POST | List / create legal notices |
| `/api/admin/cms/legal/[id]` | GET, PATCH, DELETE | Single legal notice |

---

## 4. Content Delivery — `lib/cms.ts`

Typed async getter functions for use in RSC page components. Each getter:
- Connects to DB via `lib/db.ts`
- Returns typed data or hardcoded defaults if collection empty
- Never throws — always returns safe fallback

```ts
export async function getSiteConfig(): Promise<SiteConfigData>
export async function getNavMenu(): Promise<NavMenuData>
export async function getHomePage(): Promise<HomePageData>
export async function getAboutPage(): Promise<AboutPageData>
export async function getFAQ(): Promise<FAQData>
export async function getFooter(): Promise<FooterData>
export async function getLegalNotice(type: LegalNoticeType): Promise<LegalNoticeData>
export async function getPublishedBlogPosts(limit?: number): Promise<BlogPostData[]>
export async function getBlogPost(slug: string): Promise<BlogPostData | null>
```

Only `published` content is returned by public getters. Draft/hidden only accessible via admin API.

---

## 5. Admin UI

### 5.1 Entry Point

New tab **"შინაარსი"** (Content) added to existing tab list in `admin-dashboard.tsx`. Renders `<CMSPanel />`.

### 5.2 CMSPanel Layout

Two-column layout inside the tab:
- **Left sidebar** (~200px): section nav links
- **Right content area**: active section form

Sidebar sections (Georgian labels):
1. საიტის პარამეტრები (Site Config)
2. ნავიგაცია (Navigation)
3. მთავარი გვერდი (Homepage)
4. ჩვენ შესახებ (About)
5. კითხვა-პასუხი (FAQ)
6. ბლოგი (Blog)
7. ქვედა კოლონტიტული (Footer)
8. სამართლებრივი შენიშვნები (Legal Notices)

### 5.3 Section Forms

**Site Config:**
- Logo: image preview + upload button (→ `/api/upload`) + delete button
- Favicon: same pattern
- Text fields: siteName, tagline, contactEmail, contactPhone, contactAddress
- Social links: 4 URL inputs
- Save button

**Navigation:**
- Drag-to-reorder list (using `@hello-pangea/dnd` or CSS drag API)
- Each item: label input, href input, isExternal checkbox, delete button
- "Add link" button appends new item
- Publish / Save Draft buttons

**Homepage:**
- Collapsible subsections: Hero, Stats (4 rows), Features (add/remove/reorder), Services (add/remove/reorder), CTA Section
- Hero has image upload
- Publish / Save Draft buttons

**About:**
- title input
- mission textarea
- TipTap editor for body
- Team members: list with add/remove, each has name/role/image upload
- Publish / Save Draft buttons

**FAQ:**
- List of accordion items, each: question input, answer textarea, category input, per-item status toggle (published/hidden), reorder arrows, delete
- "Add question" button (new items default to `status: "draft"`)
- Save button (no top-level publish; each item controls its own visibility via status)

**Blog:**
- Posts table: title, category, status badge, publishedAt, Edit/Delete actions
- "New Post" button → opens post editor (full page or large modal)
- Post editor: title, slug (auto), excerpt, TipTap body, cover image upload, category select, tags, Publish / Save Draft / Hide buttons
- Categories subtab: simple table with name/slug/description, add/edit/delete

**Footer:**
- Columns: add/remove/reorder, each column has heading + list of links (label + href)
- disclaimer textarea
- copyright input
- Publish / Save Draft buttons

**Legal Notices:**
- Cards for each type: ai-warning, terms, privacy, cookie
- Each opens TipTap editor with title + body
- Publish / Save Draft / Hide buttons per notice

### 5.4 TipTap Editor Component

`src/components/admin/cms/RichTextEditor.tsx`

Extensions: StarterKit, Link, Image (Cloudinary upload via `/api/upload`), Placeholder.

Output format: TipTap JSON stored in MongoDB. Rendered on public pages via `generateHTML()` from `@tiptap/html`.

### 5.5 Image Upload Component

`src/components/admin/cms/ImageUpload.tsx`

- Shows current image preview
- "Replace" button → file input → POST to `/api/upload` → updates URL field
- "Delete" button → DELETE to `/api/admin/cms/images` with publicId → Cloudinary destroy

---

## 6. Public Page Integration

Pages modified to fetch from CMS (with fallback to hardcoded defaults):

| File | CMS getter used |
|---|---|
| `src/components/site/header.tsx` | `getNavMenu()`, `getSiteConfig()` (logo) |
| `src/components/site/footer.tsx` | `getFooter()`, `getSiteConfig()` |
| `src/app/page.tsx` | `getHomePage()` |
| `src/app/about/page.tsx` (new) | `getAboutPage()` |
| `src/app/blog/page.tsx` (new) | `getPublishedBlogPosts()` |
| `src/app/blog/[slug]/page.tsx` (new) | `getBlogPost(slug)` |
| `src/app/faq/page.tsx` (new) | `getFAQ()` |

---

## 7. Status / Publish Workflow

- New content created with `status: "draft"`
- "Publish" button → PATCH `{ status: "published", publishedAt: new Date() }`
- "Hide" button → PATCH `{ status: "hidden" }`
- "Back to Draft" button → PATCH `{ status: "draft" }`
- Public getters filter: `{ status: "published" }`
- Singleton pages (homepage, nav, footer, about): one document, edits saved immediately to DB. Publish changes `status` to `"published"` — public getters only return content when `status === "published"`. Unpublished singletons fall back to hardcoded defaults on public pages. There is no separate "draft copy" alongside a live version — admin edits the single document directly.

---

## 8. New Dependencies

| Package | Purpose |
|---|---|
| `@tiptap/react` | React TipTap editor |
| `@tiptap/starter-kit` | Base extensions (bold, italic, headings, lists, etc.) |
| `@tiptap/extension-link` | Link support |
| `@tiptap/extension-image` | Image in rich text |
| `@tiptap/extension-placeholder` | Placeholder text |
| `@tiptap/html` | Server-side HTML generation from TipTap JSON |
| `@hello-pangea/dnd` | Drag-to-reorder lists in nav/FAQ/homepage |

---

## 9. File Structure (New Files)

```
src/
├── lib/
│   ├── cms.ts                          # Public typed getters
│   └── models/
│       ├── SiteConfig.ts
│       ├── NavMenu.ts
│       ├── HomePage.ts
│       ├── AboutPage.ts
│       ├── FAQ.ts
│       ├── BlogPost.ts
│       ├── BlogCategory.ts
│       ├── FooterContent.ts
│       └── LegalNotice.ts
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── cms/
│   │           ├── site-config/route.ts
│   │           ├── nav/route.ts
│   │           ├── homepage/route.ts
│   │           ├── about/route.ts
│   │           ├── faq/route.ts
│   │           ├── blog/
│   │           │   ├── posts/
│   │           │   │   ├── route.ts
│   │           │   │   └── [id]/route.ts
│   │           │   └── categories/
│   │           │       ├── route.ts
│   │           │       └── [id]/route.ts
│   │           ├── footer/route.ts
│   │           ├── legal/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           └── images/route.ts    # Cloudinary delete proxy
│   ├── about/page.tsx                 # New public page
│   ├── blog/
│   │   ├── page.tsx                   # Blog listing
│   │   └── [slug]/page.tsx            # Blog post
│   └── faq/page.tsx                   # FAQ public page
└── components/
    └── admin/
        └── cms/
            ├── CMSPanel.tsx           # Main CMS shell (sidebar + router)
            ├── CMSSidebar.tsx
            ├── RichTextEditor.tsx     # TipTap wrapper
            ├── ImageUpload.tsx        # Cloudinary upload widget
            ├── SiteConfigForm.tsx
            ├── NavMenuForm.tsx
            ├── HomePageForm.tsx
            ├── AboutPageForm.tsx
            ├── FAQForm.tsx
            ├── BlogPanel.tsx          # Posts table + category subtab
            ├── BlogPostEditor.tsx     # Full post editor
            ├── FooterForm.tsx
            └── LegalNoticesForm.tsx
```

---

## 10. Out of Scope (this phase)

- Revision history / content versioning
- Scheduled publish (future date)
- Multi-language content (Georgian + English variants)
- Image alt text management (can be added later per field)
- Preview of draft content on public URL
