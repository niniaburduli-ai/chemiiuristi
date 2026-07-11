# How It Works Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CMS-editable "How it Works" section to the homepage, directly after the Services section, with one tab per service (AI consultation, document review, templates, document generation) showing numbered usage steps and a CTA.

**Architecture:** Content lives on the existing `HomePage` Mongoose doc, in a new `howItWorks` array locked to the 4 real service keys (`chat`/`review`/`templates`/`generate`) — mirrors the `features`/`stats` CMS pattern already in the codebase. A new client component `HowItWorks` renders it as tabs, reusing the same icon/href/modal-trigger logic `ServiceCards` already has (hardcoded per key, not CMS fields) so tab behavior can't point at a broken route. Admin editing goes in the existing `HomePageForm.tsx`, following its existing per-array-item editor pattern.

**Tech Stack:** Next.js 16 App Router, TypeScript, Mongoose, React 19 (one new client component), Tailwind + shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-07-11-how-it-works-design.md` (approved).

## Global Constraints

- No test runner is configured in this repo (confirmed in `CLAUDE.md`). Every task's verify step uses `npx tsc --noEmit`, `npm run lint`, and/or a manual dev-server check in the browser.
- Next.js 16 App Router conventions apply — read `node_modules/next/dist/docs/01-app/` before touching routing/caching if anything looks unfamiliar (per root `CLAUDE.md`/`AGENTS.md`).
- Path alias `@/*` → `src/*`.
- The 4 `howItWorks` items are locked to keys `chat`, `review`, `templates`, `generate` — no admin add/remove/reorder UI for the array itself, only for each item's `steps` sub-array. This is a deliberate scope constraint from the spec, not an oversight to "fix" later.
- Icon and href/modal-trigger behavior for each key are hardcoded in the new frontend component (not CMS fields) — only text (title, steps, CTA label) is admin-editable.
- Bilingual fields follow the existing single-doc `field`/`fieldEn` pattern used throughout `HomePageData` — no separate English Mongo document.

---

## File Structure

**New files:**
- `src/components/site/how-it-works.tsx` — client component rendering the tab bar + active tab's steps + CTA. Modeled on `src/components/site/service-cards.tsx`.

**Modified files:**
- `src/types/cms.ts` — add `HomePageHowItWorksStep`, `HomePageHowItWorksItem` types; add `howItWorks`, `howItWorksHeading`/`-En`, `sections.howItWorks` to `HomePageData`.
- `src/lib/models/HomePage.ts` — add matching sub-schemas and fields.
- `src/lib/homepage-defaults.ts` — seed content for the 4 items (ka+en).
- `src/app/api/admin/cms/homepage/route.ts` — GET backfill for the new fields (old docs pre-date this schema).
- `src/components/admin/cms/HomePageForm.tsx` — new "How it Works" section, plus `EMPTY` constant update.
- `src/app/page.tsx` — compute heading + localized items, render `<HowItWorks>` after `<ServiceCards>`.

---

### Task 1: Types — `HomePageHowItWorksItem` + `HomePageData` fields

**Files:**
- Modify: `src/types/cms.ts`

**Interfaces:**
- Produces: `HomePageHowItWorksStep { text: string; textEn?: string }`, `HomePageHowItWorksItem { key: "chat"|"review"|"templates"|"generate"; title: string; titleEn?: string; steps: HomePageHowItWorksStep[]; ctaText: string; ctaTextEn?: string }`, and on `HomePageData`: `sections.howItWorks: boolean`, `howItWorksHeading: string`, `howItWorksHeadingEn?: string`, `howItWorks: HomePageHowItWorksItem[]`. Consumed by every later task.

- [ ] **Step 1: Add the two new interfaces**

Edit `src/types/cms.ts`, insert right after the `HomePagePlan` interface (currently ends at line 77, right before `export interface HomePageData {`):

```ts
export interface HomePageHowItWorksStep {
  text: string
  textEn?: string
}

export interface HomePageHowItWorksItem {
  key: "chat" | "review" | "templates" | "generate"
  title: string
  titleEn?: string
  steps: HomePageHowItWorksStep[]
  ctaText: string
  ctaTextEn?: string
}

```

- [ ] **Step 2: Extend `HomePageData`**

In the same file, edit the `sections` field of `HomePageData` (currently lines 80-86):

```ts
  sections: {
    hero: boolean
    stats: boolean
    features: boolean
    pricing: boolean
    faq: boolean
    howItWorks: boolean
  }
```

Then add the new top-level fields right after `cardsHeadingEn?: string` (currently line 99, right before `statsHeading: string`):

```ts
  howItWorksHeading: string
  howItWorksHeadingEn?: string
  howItWorks: HomePageHowItWorksItem[]
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: new errors at every place that constructs a `HomePageData`/`sections` object literal without the new fields — that's expected at this point in the plan (Tasks 2-7 fix each site). Confirm the errors are exactly in `src/lib/homepage-defaults.ts`, `src/components/admin/cms/HomePageForm.tsx`, and nowhere else. If anything outside those two files errors, stop and investigate before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/types/cms.ts
git commit -m "feat: add HowItWorks types to HomePageData"
```

---

### Task 2: Mongoose schema — `HomePage.ts`

**Files:**
- Modify: `src/lib/models/HomePage.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: schema fields matching Task 1's types exactly (Mongoose schema and the TS interface must stay in lockstep — `HomePageDoc` is `HomePageData & {...}`, so a mismatch here surfaces as a runtime shape mismatch, not a compile error).

- [ ] **Step 1: Add the sub-schemas**

Edit `src/lib/models/HomePage.ts`, insert after the `featureSchema` definition (currently ends at line 48, right before `const planSchema = ...`):

```ts
const howItWorksStepSchema = new Schema(
  {
    text: { type: String, default: "" },
    textEn: { type: String, default: "" },
  },
  { _id: false }
)

const howItWorksItemSchema = new Schema(
  {
    key: { type: String, enum: ["chat", "review", "templates", "generate"], required: true },
    title: { type: String, default: "" },
    titleEn: { type: String, default: "" },
    steps: [howItWorksStepSchema],
    ctaText: { type: String, default: "" },
    ctaTextEn: { type: String, default: "" },
  },
  { _id: false }
)

```

- [ ] **Step 2: Add fields to `HomePageSchema`**

In the same file, edit the `sections` block of `HomePageSchema` (currently lines 69-75):

```ts
    sections: {
      hero: { type: Boolean, default: true },
      stats: { type: Boolean, default: true },
      features: { type: Boolean, default: true },
      pricing: { type: Boolean, default: true },
      faq: { type: Boolean, default: true },
      howItWorks: { type: Boolean, default: true },
    },
```

Then add the new top-level fields right after `cardsHeadingEn` (currently line 88, right before `statsHeading`):

```ts
    howItWorksHeading: { type: String, default: "" },
    howItWorksHeadingEn: { type: String, default: "" },
    howItWorks: [howItWorksItemSchema],
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (it's structurally typed against `HomePageData` via `HomePageDoc`, and the shapes now match).

- [ ] **Step 4: Commit**

```bash
git add src/lib/models/HomePage.ts
git commit -m "feat: add howItWorks sub-schema to HomePage model"
```

---

### Task 3: Seed content — `homepage-defaults.ts`

**Files:**
- Modify: `src/lib/homepage-defaults.ts`

**Interfaces:**
- Consumes: `HomePageHowItWorksItem` from Task 1.
- Produces: `HOME_SEED.sections.howItWorks`, `HOME_SEED.howItWorksHeading(/En)`, `HOME_SEED.howItWorks` (4 items) — consumed by Task 4 (GET backfill fallback) and Task 7 (`page.tsx` fallback when CMS doc is null/draft).

- [ ] **Step 1: Add `howItWorks: true` to the seed's `sections`**

Edit `src/lib/homepage-defaults.ts` line 6:

```ts
  sections: { hero: true, stats: true, features: true, pricing: true, faq: true, howItWorks: true },
```

- [ ] **Step 2: Add the heading + 4 items**

In the same file, insert after the `cardsHeading`/`cardsHeadingEn` lines (currently lines 40-41, right before `statsHeading: "ჩვენი შედეგები ციფრებში",`):

```ts
  howItWorksHeading: "როგორ მუშაობს",
  howItWorksHeadingEn: "How it works",
  howItWorks: [
    {
      key: "chat",
      title: "AI კონსულტაცია", titleEn: "AI consultation",
      steps: [
        { text: "გახსენი ჩატი", textEn: "Open the chat" },
        { text: "დაწერე შენი იურიდიული საკითხი მარტივი ენით", textEn: "Describe your legal question in plain language" },
        { text: "მიიღე მყისიერი პასუხი მოქმედი კანონმდებლობის მითითებით", textEn: "Get an instant answer citing current legislation" },
      ],
      ctaText: "კითხვის დასმა", ctaTextEn: "Ask a question",
    },
    {
      key: "review",
      title: "დოკუმენტის ანალიზი", titleEn: "Document review",
      steps: [
        { text: "აირჩიე დოკუმენტის ან ფოტოს რეჟიმი", textEn: "Choose document or photo mode" },
        { text: "ატვირთე ფაილი (PDF, DOCX, TXT ან სურათები)", textEn: "Upload your file (PDF, DOCX, TXT, or images)" },
        { text: "ნახე გამოვლენილი რისკები კატეგორიების მიხედვით და რეკომენდაციები", textEn: "Review the categorized risks and recommendations" },
      ],
      ctaText: "დოკუმენტის შემოწმება", ctaTextEn: "Check a document",
    },
    {
      key: "templates",
      title: "მზა შაბლონები", titleEn: "Ready-made templates",
      steps: [
        { text: "მოძებნე ან დაათვალიერე შაბლონების ბიბლიოთეკა", textEn: "Search or browse the template library" },
        { text: "შეავსე შენი მონაცემები და ჩამოტვირთე დოკუმენტი", textEn: "Fill in your details and download the document" },
      ],
      ctaText: "შაბლონის არჩევა", ctaTextEn: "Choose a template",
    },
    {
      key: "generate",
      title: "დოკუმენტის მომზადება", titleEn: "Document generation",
      steps: [
        { text: "აღწერე შენი სიტუაცია", textEn: "Describe your situation" },
        { text: "AI ადგენს საჩივარს ან მოთხოვნას შენს მონაცემებზე დაყრდნობით", textEn: "AI drafts the complaint or demand based on your details" },
        { text: "გადახედე, მოითხოვე შესწორება ან ჩამოტვირთე", textEn: "Review it, request a revision, or download" },
      ],
      ctaText: "დოკუმენტის შექმნა", ctaTextEn: "Create a document",
    },
  ],
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors from this file.

- [ ] **Step 4: Commit**

```bash
git add src/lib/homepage-defaults.ts
git commit -m "feat: add How It Works seed content for all 4 services"
```

---

### Task 4: API backfill — `admin/cms/homepage/route.ts`

**Files:**
- Modify: `src/app/api/admin/cms/homepage/route.ts`

**Interfaces:**
- Consumes: `HOME_SEED.howItWorks`/`howItWorksHeading(/En)` from Task 3.
- Produces: no new exports — GET now returns the new fields (backfilled from seed) for any pre-existing published/draft doc that predates this schema change.

- [ ] **Step 1: Extend the GET backfill object**

Edit `src/app/api/admin/cms/homepage/route.ts`. The `data` object built in `GET()` (currently lines 25-47) already spreads `...raw` first, then overrides specific fields with seed fallbacks. Add the same pattern for the new fields — insert right after the `sections` line (currently line 27):

```ts
    sections: { ...HOME_SEED.sections, ...(raw.sections as object | undefined) },
    howItWorksHeading: (raw.howItWorksHeading as string | undefined) || HOME_SEED.howItWorksHeading,
    howItWorksHeadingEn: (raw.howItWorksHeadingEn as string | undefined) || HOME_SEED.howItWorksHeadingEn,
    howItWorks: (raw.howItWorks as unknown[] | undefined)?.length
      ? raw.howItWorks
      : HOME_SEED.howItWorks,
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

Start the dev server (`npm run dev`), sign in as an admin, open `/admin`, and confirm the homepage CMS `GET` no longer 500s (check the Network tab or just that the homepage editor loads without an error banner). At this point the new section won't render yet in the admin UI (Task 5) — this step only confirms the API doesn't crash on old data.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/cms/homepage/route.ts
git commit -m "feat: backfill howItWorks fields for pre-existing homepage CMS docs"
```

---

### Task 5: Admin UI — `HomePageForm.tsx`

**Files:**
- Modify: `src/components/admin/cms/HomePageForm.tsx`

**Interfaces:**
- Consumes: `HomePageHowItWorksItem`, `HomePageHowItWorksStep` from Task 1.
- Produces: no new exports — extends the existing default-exported `HomePageForm` component's rendered UI and local state helpers.

- [ ] **Step 1: Import the new types and update `EMPTY`**

Edit the import at the top of `src/components/admin/cms/HomePageForm.tsx` (currently line 12-14):

```ts
import type {
  HomePageData, HomePageServiceCard, HomePageStatCard, HomePageFeature, HomePagePlan,
  HomePageHowItWorksItem,
} from "@/types/cms"
```

Edit the `EMPTY` constant (currently lines 31-45) to add the new fields — `sections` and the two new top-level entries:

```ts
const EMPTY: HomePageData = {
  sections: { hero: true, stats: true, features: true, pricing: true, faq: true, howItWorks: true },
  hero: { title: "", titleEn: "", subtitle: "", subtitleEn: "", ctaText: "", ctaHref: "", imageUrl: "", imagePubId: "" },
  serviceCards: [],
  cardsHeading: "", cardsHeadingEn: "",
  howItWorksHeading: "", howItWorksHeadingEn: "",
  howItWorks: [
    { key: "chat", title: "", titleEn: "", steps: [], ctaText: "", ctaTextEn: "" },
    { key: "review", title: "", titleEn: "", steps: [], ctaText: "", ctaTextEn: "" },
    { key: "templates", title: "", titleEn: "", steps: [], ctaText: "", ctaTextEn: "" },
    { key: "generate", title: "", titleEn: "", steps: [], ctaText: "", ctaTextEn: "" },
  ],
  statsHeading: "", statsHeadingEn: "",
  stats: [],
  featuresHeading: "", featuresHeadingEn: "",
  features: [],
  pricingHeading: "", pricingHeadingEn: "",
  plans: [],
  faqHeading: "", faqHeadingEn: "",
  ctaSection: { buttonText: "", buttonTextEn: "", buttonHref: "" },
  status: "draft",
}
```

(This `EMPTY` fallback matters because the fetched CMS doc might be missing `howItWorks` entirely on a very old doc that hasn't hit the GET backfill from Task 4 yet — e.g. right after a schema change but before that doc has been re-saved. `{ ...EMPTY, ...d }` on line 155 means a `howItWorks: undefined` from the server would still be overwritten by `d`'s `undefined`, not fall back to `EMPTY`'s 4 blanks — but Task 4's backfill guarantees the GET response always includes it, so this is a defensive default, not the primary path.)

- [ ] **Step 2: Add per-item and per-step helpers**

Insert after the `delFeature` function (currently ends at line 255, right before the `// ── Plan helpers ──` comment):

```ts
  // ── How It Works helpers ───────────────────────────────────────────────────

  function updHowItWorksItem(i: number, patch: Partial<HomePageHowItWorksItem>) {
    setData((p) => {
      const howItWorks = [...p.howItWorks]
      howItWorks[i] = { ...howItWorks[i], ...patch }
      return { ...p, howItWorks }
    })
  }

  function addHowItWorksStep(i: number) {
    setData((p) => {
      const howItWorks = [...p.howItWorks]
      howItWorks[i] = { ...howItWorks[i], steps: [...howItWorks[i].steps, { text: "", textEn: "" }] }
      return { ...p, howItWorks }
    })
  }

  function updHowItWorksStep(i: number, si: number, patch: Partial<{ text: string; textEn: string }>) {
    setData((p) => {
      const howItWorks = [...p.howItWorks]
      const steps = [...howItWorks[i].steps]
      steps[si] = { ...steps[si], ...patch }
      howItWorks[i] = { ...howItWorks[i], steps }
      return { ...p, howItWorks }
    })
  }

  function delHowItWorksStep(i: number, si: number) {
    setData((p) => {
      const howItWorks = [...p.howItWorks]
      howItWorks[i] = { ...howItWorks[i], steps: howItWorks[i].steps.filter((_, j) => j !== si) }
      return { ...p, howItWorks }
    })
  }

```

- [ ] **Step 3: Render the section**

Insert a new `<section>` after the Features section's closing `</section>` (currently line 584, right before the `{/* ── Pricing ── */}` comment on line 586):

```tsx
      {/* ── How It Works ── */}
      <section className="space-y-3 rounded-lg border p-4">
        <SectionHeader
          title='როგორ მუშაობს ("How it Works")'
          visible={sec.howItWorks}
          onToggle={() => setData((p) => ({ ...p, sections: { ...p.sections, howItWorks: !p.sections.howItWorks } }))}
        />

        <BiInput
          label="სექციის სათაური"
          kaValue={data.howItWorksHeading}
          enValue={data.howItWorksHeadingEn ?? ""}
          onKa={(v) => upd("howItWorksHeading", v)}
          onEn={(v) => upd("howItWorksHeadingEn", v)}
        />

        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          თითოეული ჩანართი შეესაბამება არსებულ სერვისს — ჩანართის დამატება/წაშლა შეუძლებელია, მხოლოდ ტექსტისა და ნაბიჯების რედაქტირება. ჩანართი ავტომატურად იმალება, თუ შესაბამისი სერვისი გამორთულია (Features ტაბი).
        </p>

        <div className="space-y-3">
          {data.howItWorks.map((item, i) => (
            <div key={item.key} className="rounded border p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.key}</p>
              <BiInput
                label="Title"
                kaValue={item.title}
                enValue={item.titleEn ?? ""}
                onKa={(v) => updHowItWorksItem(i, { title: v })}
                onEn={(v) => updHowItWorksItem(i, { titleEn: v })}
              />
              <div className="space-y-1.5 pl-3 border-l-2">
                <Label className="text-xs">Steps</Label>
                {item.steps.map((step, si) => (
                  <div key={si} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <BiInput
                        label={`Step ${si + 1}`}
                        kaValue={step.text}
                        enValue={step.textEn ?? ""}
                        onKa={(v) => updHowItWorksStep(i, si, { text: v })}
                        onEn={(v) => updHowItWorksStep(i, si, { textEn: v })}
                      />
                    </div>
                    <DeleteBtn onClick={() => delHowItWorksStep(i, si)} />
                  </div>
                ))}
                <Button type="button" size="sm" variant="ghost" onClick={() => addHowItWorksStep(i)}>
                  <Plus className="mr-1 h-3 w-3" /> Add step
                </Button>
              </div>
              <BiInput
                label="CTA Text"
                kaValue={item.ctaText}
                enValue={item.ctaTextEn ?? ""}
                onKa={(v) => updHowItWorksItem(i, { ctaText: v })}
                onEn={(v) => updHowItWorksItem(i, { ctaTextEn: v })}
              />
            </div>
          ))}
        </div>
      </section>

```

- [ ] **Step 4: Verify types compile and lint passes**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual check**

Start the dev server, open `/admin`, go to the homepage editor. Confirm:
- A "How it Works" section appears after Features, with a visibility toggle
- All 4 items (`chat`, `review`, `templates`, `generate`) show with their seeded title/steps/CTA
- Adding a step, editing text, and deleting a step all update the UI
- Clicking "გამოქვეყნება" (publish) saves without error, and reloading the page shows the saved edits persisted

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/cms/HomePageForm.tsx
git commit -m "feat: add How It Works editor to homepage CMS admin form"
```

---

### Task 6: Frontend component — `how-it-works.tsx`

**Files:**
- Create: `src/components/site/how-it-works.tsx`

**Interfaces:**
- Consumes: `FeatureFlagsData` (from `@/lib/features`), `Locale` (from `@/lib/i18n/config`), `DocumentAnalysisModal` (from `@/components/site/document-analysis-modal`), `AnimateIn` (from `@/components/site/AnimateIn`).
- Produces: `HowItWorks({ heading, items, flags, locale }: { heading: string; items: { key: "chat"|"review"|"templates"|"generate"; title: string; steps: string[]; ctaText: string }[]; flags: FeatureFlagsData; locale: Locale })` — a default-exported-free named export, consumed by Task 7 (`page.tsx`). Note `items` here are **already locale-picked plain strings** (the picking happens in `page.tsx`, matching how `cardsHeading`/`featuresHeading` etc. are already-picked strings by the time they reach a component) — this component does no `pick()` calls itself.

- [ ] **Step 1: Write the component**

Create `src/components/site/how-it-works.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, FolderSearch, LayoutTemplate, FileText, ArrowRight } from "lucide-react";
import { AnimateIn } from "@/components/site/AnimateIn";
import { DocumentAnalysisModal } from "@/components/site/document-analysis-modal";
import type { FeatureFlagsData } from "@/lib/features";
import type { Locale } from "@/lib/i18n/config";

type ServiceKey = "chat" | "review" | "templates" | "generate";

type HowItWorksItem = {
  key: ServiceKey;
  title: string;
  steps: string[];
  ctaText: string;
};

const SERVICE_META: Record<ServiceKey, { icon: typeof MessageCircle; href: string | null }> = {
  chat: { icon: MessageCircle, href: "/chat" },
  review: { icon: FolderSearch, href: null },
  templates: { icon: LayoutTemplate, href: "/templates" },
  generate: { icon: FileText, href: "/generate" },
};

export function HowItWorks({
  heading,
  items,
  flags,
  locale,
}: {
  heading: string;
  items: HowItWorksItem[];
  flags: FeatureFlagsData;
  locale: Locale;
}) {
  const visibleItems = items.filter((i) => flags[i.key]);
  const [activeKey, setActiveKey] = useState<ServiceKey | null>(visibleItems[0]?.key ?? null);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (visibleItems.length === 0) return null;

  const active = visibleItems.find((i) => i.key === activeKey) ?? visibleItems[0];
  const meta = SERVICE_META[active.key];
  const Icon = meta.icon;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{heading}</h2>
        <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-gold mx-auto mt-4 rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                item.key === active.key
                  ? "bg-gradient-to-r from-primary to-gold text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <AnimateIn key={active.key} className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{active.title}</h3>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            {active.steps.map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-gold text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          {meta.href ? (
            <Link
              href={meta.href}
              className="group inline-flex items-center gap-2 bg-gold text-slate-900 px-6 py-3 rounded-xl text-sm font-semibold hover:brightness-95 btn-hover"
            >
              {active.ctaText}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="group inline-flex items-center gap-2 bg-gold text-slate-900 px-6 py-3 rounded-xl text-sm font-semibold hover:brightness-95 btn-hover"
            >
              {active.ctaText}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </AnimateIn>
      </div>

      <DocumentAnalysisModal open={reviewOpen} onOpenChange={setReviewOpen} locale={locale} />
    </section>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/site/how-it-works.tsx
git commit -m "feat: add HowItWorks tabbed component"
```

---

### Task 7: Wire into the homepage — `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `HowItWorks` from Task 6, `HOME_SEED.howItWorks`/`howItWorksHeading(/En)` from Task 3, `pick` from `@/lib/i18n/loc` (already imported in this file).
- Produces: nothing new — this is the leaf wiring task.

- [ ] **Step 1: Import the component**

Edit `src/app/page.tsx`, add to the import block (currently lines 4-6, right after the `ServiceCards` import):

```tsx
import { ServiceCards } from "@/components/site/service-cards"
import { HowItWorks } from "@/components/site/how-it-works"
```

- [ ] **Step 2: Compute the heading and localized items**

Edit `src/app/page.tsx`, insert after the `cardsHeading` block (currently lines 76-80, right before the `// ── Stats ──` comment... note: re-check exact placement — insert right after the closing `)` of the `cardsHeading` `pick(...)` call and before the `statsHeading` block):

```ts
  const howItWorksHeading = pick(
    cmsData?.howItWorksHeading   || seed.howItWorksHeading,
    cmsData?.howItWorksHeadingEn || seed.howItWorksHeadingEn,
    locale,
  )

  const howItWorksItems = (cmsData?.howItWorks?.length ? cmsData.howItWorks : seed.howItWorks).map((item) => ({
    key: item.key,
    title: pick(item.title, item.titleEn, locale),
    steps: item.steps.map((s) => pick(s.text, s.textEn, locale)),
    ctaText: pick(item.ctaText, item.ctaTextEn, locale),
  }))
```

- [ ] **Step 3: Render the section**

Edit `src/app/page.tsx`, right after the `{/* ── SERVICE CARDS ── */}` block's closing `)}` (currently line 187, right before the `{/* ── FEATURES + STATS ── */}` comment):

```tsx
      {/* ── HOW IT WORKS ── */}
      {sections.howItWorks !== false && (
        <HowItWorks
          heading={howItWorksHeading}
          items={howItWorksItems}
          flags={flags}
          locale={locale}
        />
      )}

```

- [ ] **Step 4: Verify types compile and app builds**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual check in the browser**

Start the dev server, open `/` (both `ka` default and `?locale=en` or however this repo's locale switch works — check `src/lib/i18n/locale.ts` if unsure). Confirm:
- "How it Works" section renders directly after the Services section, before Features/Stats
- Tab bar shows all 4 services (assuming all 4 feature flags are on); clicking each tab swaps the visible steps + CTA
- The `review` tab's CTA button opens the document analysis modal (not a navigation)
- The `chat`/`templates`/`generate` tabs' CTA buttons link to `/chat`, `/templates`, `/generate` respectively
- Turning a feature flag off in `/admin` (Features tab) removes that tab from the section without breaking the others
- English locale shows the English copy

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: render How It Works section on the homepage"
```

---

## Self-Review Notes

- **Spec coverage:** tabs layout (Task 6), locked 4 keys with per-service steps of varying length (Tasks 3, 5, 6), CTA per tab (Task 6), CMS-driven with admin editor (Tasks 1-5), section toggle (Tasks 1, 2, 5, 7), hardcoded icon/href per key (Task 6) — all covered.
- **Type consistency:** `HomePageHowItWorksItem.key` (Task 1) matches the `ServiceKey` union in `how-it-works.tsx` (Task 6) and the `enum` in the Mongoose schema (Task 2) — all four call sites use the literal strings `"chat"|"review"|"templates"|"generate"` in the same order everywhere.
- **No placeholders:** every step has complete code, not a description of what to write.
