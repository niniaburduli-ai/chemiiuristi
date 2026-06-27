# Page Consistency Redesign

**Date:** 2026-06-27  
**Goal:** Bring all remaining pages to the same UI/UX standard as the Home page — same color tokens, typography, card design, animations, and micro-interactions.

---

## Problem

Six pages use a hardcoded legacy indigo palette (`#6366f1`, `#3730a3`, `#4338ca`, `#1a1a2e`, `text-gray-*`, `bg-[#f7f7ff]`, `border-[#e0e0ff]`). Three pages are bare content dumps with no hero, no cards, and no animations. The Chat page intro lacks animation polish.

**Affected pages:** About, Services, Legislation (client), Blog, Terms, Privacy, Disclaimer, Chat.

**Already consistent (no changes):** Home, Pricing, Login, Register, Dashboard, Billing, Profile.

---

## Design System Reference (from Home page)

| Token | Usage |
|-------|-------|
| `bg-primary` | Hero backgrounds, icon containers (via `/10`), top-accent borders |
| `text-primary` | Links, icons, accent text |
| `text-gold` | Hero subtitle text |
| `text-foreground` | All heading text |
| `text-muted-foreground` | Body/description text |
| `bg-card border-border` | Card backgrounds |
| `bg-muted/40` | Subtle section backgrounds |
| `rounded-2xl` | All cards and containers |
| `border-t-[3px] border-t-primary` | Active card top accent |
| `card-hover` | Hover micro-interaction on all clickable cards |
| `btn-hover` | Hover micro-interaction on all buttons |
| `AnimateIn` | Scroll-triggered fade-up for cards/sections |
| `animate-fade-up` | Immediate fade-up for page-level headings |

---

## Solution

### 1. New Shared Component: `PageHero`

**File:** `src/components/site/PageHero.tsx`

Server component. Used by: About, Services, Blog, Terms, Privacy, Disclaimer.

```tsx
export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="bg-primary">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white animate-fade-up leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl text-gold mt-3 font-semibold animate-fade-up delay-150 leading-snug max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
```

---

### 2. About Page (`src/app/about/page.tsx`)

**Changes:**
- Replace gradient hero section with `<PageHero title={title} subtitle={intro_first_line} />` — or keep intro text below hero in body.
- Actually: hero shows `title` only; `intro` text renders below in a clean `container py-12 max-w-3xl` section.
- Section dividers: `w-1 h-8 rounded-full bg-primary` (remove hardcoded `bg-[#6366f1]` / `bg-[#4338ca]`).
- Mission section background: `bg-muted/40 border-y border-border` (remove `bg-[#f7f7ff] border-[#e0e0ff]`).
- Team avatar placeholder: `bg-primary/10` bg + `text-primary` initial (remove `bg-[#ededff]` / `text-[#6366f1]`).
- Team icon: `text-primary` (remove `text-[#6366f1]`).
- All `text-gray-*` → `text-muted-foreground`.
- All `text-[#1a1a2e]` → `text-foreground`.
- Wrap each team card in `<AnimateIn delay={idx * 80}>`.

---

### 3. Services Page (`src/app/services/page.tsx`)

**Changes:**
- Add `<PageHero title={d.services.title} subtitle={d.services.subtitle} />` at top, remove inline `<h1>` + `<p>` heading.
- Active service cards: add `border-t-[3px] border-t-primary`, use `bg-card border-border`. Remove `bg-white border-[#e0e0ff]`.
- Coming-soon cards: `border-t-[3px] border-t-border bg-card border-border opacity-60`.
- Icon container: `bg-primary/10` / `text-primary` (remove `bg-[#ededff]` / `text-[#6366f1]`).
- Icon color for coming-soon: `text-primary/30`.
- Feature checkmark `<Check>`: `text-primary` (remove `text-[#6366f1]`).
- CTA button: `bg-primary hover:bg-primary/90 text-primary-foreground btn-hover rounded-xl` (remove `bg-[#4338ca]`).
- Subtitle text under title: `text-primary` (remove `text-[#6366f1]`).
- All `text-gray-*` → `text-muted-foreground`, `text-[#1a1a2e]` → `text-foreground`.
- Wrap each service card in `<AnimateIn delay={idx * 100}>`.

---

### 4. Legislation Client (`src/app/legislation/legislation-client.tsx`)

**Changes:**
- Doc link cards: replace `bg-[#f7f7ff] border-[#e0e0ff]` → `bg-card border-border card-hover`.
- Icon circle: `bg-primary/10` → replace `bg-[#ededff]`; icon `text-primary` → replace `text-[#6366f1]`.
- Doc title link text: `text-primary font-bold` → replace `text-[#3730a3]`.
- Description text: `text-muted-foreground` → replace `text-gray-500`.
- No structural changes (search + tabs stay).

---

### 5. Blog Page (`src/app/blog/page.tsx`)

**Changes:**
- Add `<PageHero title="ბლოგი" />` at top.
- Replace bare `<ul>/<li>` list with a grid of cards:
  ```tsx
  <div className="grid gap-5 md:grid-cols-2">
    {posts.map((post, idx) => (
      <AnimateIn key={...} delay={idx * 60}>
        <Link href={`/blog/${post.slug}`} className="bg-card border border-border border-t-[3px] border-t-primary rounded-2xl p-6 flex flex-col gap-3 card-hover group h-full">
          <p className="font-bold text-foreground leading-snug">{post.title}</p>
          {post.excerpt && <p className="text-sm text-muted-foreground">{post.excerpt}</p>}
          <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
            წაიკითხეთ <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </AnimateIn>
    ))}
  </div>
  ```
- Empty state: `<p className="text-center text-muted-foreground py-12">პოსტები არ არის.</p>`

---

### 6. Terms / Privacy / Disclaimer Pages

**Same pattern for all three.**

**Changes:**
- Add `<PageHero title="..." />` at top (each page's own title).
- Wrap content in a card:
  ```tsx
  <section className="container mx-auto max-w-3xl px-4 py-12">
    <div className="bg-card border border-border rounded-2xl p-8 md:p-10 animate-fade-up delay-150 space-y-6 text-sm leading-relaxed text-foreground/90">
      {/* existing <p> tags */}
    </div>
  </section>
  ```
- Remove `<main>` wrapper (outer `<div>` is fine; layout provides the shell).

---

### 7. Chat Page (`src/app/chat/chat-client.tsx`)

**Changes:**
- Intro header block: add `animate-fade-up` to the outer div.
- User message avatar bubble: `bg-muted/40` (no change needed, already `bg-muted`).
- Assistant message `<Card>`: add `border-t-[3px] border-t-primary` class.
- Sticky input form: wrap in `<div className="sticky bottom-4 bg-background/95 backdrop-blur-sm rounded-2xl border border-border p-3 shadow-sm">` for a floating panel effect.
- No logic changes.

---

## File Change Summary

| File | Type |
|------|------|
| `src/components/site/PageHero.tsx` | **New** |
| `src/app/about/page.tsx` | Edit |
| `src/app/services/page.tsx` | Edit |
| `src/app/legislation/legislation-client.tsx` | Edit |
| `src/app/blog/page.tsx` | Edit |
| `src/app/terms/page.tsx` | Edit |
| `src/app/privacy/page.tsx` | Edit |
| `src/app/disclaimer/page.tsx` | Edit |
| `src/app/chat/chat-client.tsx` | Edit |

**Total: 1 new file, 8 edits.**

---

## Non-goals

- No content changes (text stays as-is).
- No new CMS fields.
- No changes to dashboard sub-pages (`/dashboard/consultations`, `/dashboard/documents`, `/dashboard/reviews`) — they already use consistent tokens.
- No dark mode additions beyond what the token system already provides.
