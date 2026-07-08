# Service Split Phase 4: Nav, Dashboard, Pricing & Admin Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the new `/templates` service everywhere the existing 3 services already appear — dashboard quota card, pricing feature lists, service cards/tabs, and full admin CRUD for the 4th plan field — plus fix 2 pre-existing admin gaps flagged in the original design spec (edit-modal can't edit doc counters at all; `servicesModal.templatesTab` mislabels `/generate` instead of the new `/templates`).

**Architecture:** Every touchpoint below already has an established `docGeneration`/`docReview`-shaped pattern (a `show*` boolean gate, an `include*` flag, a feature-bullet array pair) — this phase adds the `docTemplates` sibling in the identical pattern at each site, no new patterns introduced.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind + shadcn/ui, Zod. No test runner — verify via `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual browser testing across user-facing pages + `/admin`.

## Global Constraints

- Depends on Phases 1–3 being merged first (`docTemplatesRemaining`/`docTemplates`/`includeDocTemplates`/`featuresDocTemplates[En]` fields, `templates` feature flag, `/templates` page all exist).
- Mirror existing `docGeneration`/`docReview` UI patterns exactly at each site — no new visual patterns.
- Fix the 2 pre-existing gaps flagged in the design spec (admin edit-modal doc-counter editing; `servicesModal.templatesTab` mislabel) since they're touched anyway, but keep each as its own reviewable step.

---

### Task 1: Dashboard quota card

**Files:**
- Modify: `src/app/dashboard/page.tsx:63-71` (derived vars), `:98-134` (`limitMetrics` array)

**Interfaces:** none new — reads `planData.includeDocTemplates`/`.docTemplates` (Phase 1 Task 4) and `user.docTemplatesRemaining` (Phase 1 Task 1).

- [ ] **Step 1: Add derived vars**

Current (lines 63-71):
```tsx
  const consultLimit = planData?.consultations ?? 9;
  const showGenerate = flags.generate && planData ? planData.includeDocGeneration : false;
  const showReview = flags.review && planData ? planData.includeDocReview : false;
  const genLimit = showGenerate ? (planData?.docGeneration ?? 0) : 0;
  const reviewLimit = showReview ? (planData?.docReview ?? 0) : 0;

  const consultRemaining = user.consultationsRemaining ?? 0;
  const docGenRemaining = user.docGenerationRemaining ?? 0;
  const docReviewRemaining = user.docReviewRemaining ?? 0;
```

Replace with:
```tsx
  const consultLimit = planData?.consultations ?? 9;
  const showGenerate = flags.generate && planData ? planData.includeDocGeneration : false;
  const showReview = flags.review && planData ? planData.includeDocReview : false;
  const showTemplates = flags.templates && planData ? planData.includeDocTemplates : false;
  const genLimit = showGenerate ? (planData?.docGeneration ?? 0) : 0;
  const reviewLimit = showReview ? (planData?.docReview ?? 0) : 0;
  const templatesLimit = showTemplates ? (planData?.docTemplates ?? 0) : 0;

  const consultRemaining = user.consultationsRemaining ?? 0;
  const docGenRemaining = user.docGenerationRemaining ?? 0;
  const docReviewRemaining = user.docReviewRemaining ?? 0;
  const docTemplatesRemaining = user.docTemplatesRemaining ?? 0;
```

- [ ] **Step 2: Add the 4th `limitMetrics` entry**

Current (lines 98-134):
```tsx
  const limitMetrics: LimitMetric[] = [
    {
      key: "consultations",
      label: dp.questionsAsked,
      icon: <MessagesSquare className="h-4 w-4 text-primary" />,
      used: consultationsCount,
      remaining: consultRemaining,
      total: consultLimit,
      isUnlimited: isAdmin || consultLimit >= 9999,
    },
    ...(showGenerate
      ? [
          {
            key: "generate",
            label: dp.documentsGenerated,
            icon: <FileText className="h-4 w-4 text-primary" />,
            used: documentsCount,
            remaining: docGenRemaining,
            total: genLimit,
            isUnlimited: isAdmin || genLimit >= 9999,
          },
        ]
      : []),
    ...(showReview
      ? [
          {
            key: "review",
            label: dp.documentsAnalyzed,
            icon: <FileSearch className="h-4 w-4 text-primary" />,
            used: reviewsCount,
            remaining: docReviewRemaining,
            total: reviewLimit,
            isUnlimited: isAdmin || reviewLimit >= 9999,
          },
        ]
      : []),
  ];
```

Replace with (new block appended after the `showReview` spread, mirroring it exactly):
```tsx
  const limitMetrics: LimitMetric[] = [
    {
      key: "consultations",
      label: dp.questionsAsked,
      icon: <MessagesSquare className="h-4 w-4 text-primary" />,
      used: consultationsCount,
      remaining: consultRemaining,
      total: consultLimit,
      isUnlimited: isAdmin || consultLimit >= 9999,
    },
    ...(showGenerate
      ? [
          {
            key: "generate",
            label: dp.documentsGenerated,
            icon: <FileText className="h-4 w-4 text-primary" />,
            used: documentsCount,
            remaining: docGenRemaining,
            total: genLimit,
            isUnlimited: isAdmin || genLimit >= 9999,
          },
        ]
      : []),
    ...(showReview
      ? [
          {
            key: "review",
            label: dp.documentsAnalyzed,
            icon: <FileSearch className="h-4 w-4 text-primary" />,
            used: reviewsCount,
            remaining: docReviewRemaining,
            total: reviewLimit,
            isUnlimited: isAdmin || reviewLimit >= 9999,
          },
        ]
      : []),
    ...(showTemplates
      ? [
          {
            key: "templates",
            label: dp.documentsTemplated,
            icon: <FileText className="h-4 w-4 text-primary" />,
            used: templatesCount,
            remaining: docTemplatesRemaining,
            total: templatesLimit,
            isUnlimited: isAdmin || templatesLimit >= 9999,
          },
        ]
      : []),
  ];
```

Note: this introduces two new names that must exist elsewhere in the same file/scope for this to compile — `dp.documentsTemplated` (new dictionary key, added in Task 3 of this plan) and `templatesCount` (a used-count analogous to `documentsCount`/`reviewsCount`/`consultationsCount`). Before writing this step's final code, grep this file for how `documentsCount` is computed/fetched (likely a `GeneratedDocument.countDocuments({userId, source:"ai", ...})`-style call near the top of the async page component) and add a sibling `templatesCount` query filtered to `source: "template"` in the exact same style — the two counts must be mutually exclusive (AI vs template) since they're now shown as separate cards backed by the same collection.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — will fail until Task 3's dictionary key exists and the `templatesCount` query is added per the note above; that's expected mid-task. Fix both, then re-run until clean.

Manually: visit `/dashboard` as a user on a plan with `includeDocTemplates: true`, confirm a 4th metric card "დოკუმენტის შაბლონები" (or whatever `dp.documentsTemplated` reads) appears showing correct used/remaining/total, and that generating one document via `/templates` increments its "used" count without affecting the `/generate` card's count.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add templates quota card to dashboard"
```

---

### Task 2: Pricing pages — templates feature list

**Files:**
- Modify: `src/app/pricing/page.tsx:34-41`
- Modify: `src/components/site/PricingSection.tsx:39-56`

**Interfaces:** none new — reads `PlanData.includeDocTemplates`/`.featuresDocTemplates[En]` (Phase 1 Task 4).

- [ ] **Step 1: `pricing/page.tsx`**

Current (lines 34-41):
```tsx
          const baseFeatures = pickArr(p.features, p.featuresEn, locale);
          const genFeatures = p.includeDocGeneration
            ? pickArr(p.featuresDocGeneration, p.featuresDocGenerationEn, locale)
            : [];
          const revFeatures = p.includeDocReview
            ? pickArr(p.featuresDocReview, p.featuresDocReviewEn, locale)
            : [];
          const features = [...baseFeatures, ...genFeatures, ...revFeatures];
```

Replace with:
```tsx
          const baseFeatures = pickArr(p.features, p.featuresEn, locale);
          const genFeatures = p.includeDocGeneration
            ? pickArr(p.featuresDocGeneration, p.featuresDocGenerationEn, locale)
            : [];
          const revFeatures = p.includeDocReview
            ? pickArr(p.featuresDocReview, p.featuresDocReviewEn, locale)
            : [];
          const tplFeatures = p.includeDocTemplates
            ? pickArr(p.featuresDocTemplates, p.featuresDocTemplatesEn, locale)
            : [];
          const features = [...baseFeatures, ...genFeatures, ...revFeatures, ...tplFeatures];
```

- [ ] **Step 2: `PricingSection.tsx`**

Current (lines 39-56):
```tsx
    const base = pickArr(p.features, p.featuresEn, locale)
    const gen = p.includeDocGeneration
      ? pickArr(p.featuresDocGeneration, p.featuresDocGenerationEn, locale)
      : []
    const rev = p.includeDocReview
      ? pickArr(p.featuresDocReview, p.featuresDocReviewEn, locale)
      : []
    return {
      id: p.id,
      name: pick(p.name, p.nameEn, locale),
      price: Number.isInteger(gel) ? String(gel) : gel.toFixed(2),
      badge: p.highlighted ? s.popular : "",
      ctaText: paid ? s.join : s.start,
      ctaHref: paid ? "/billing" : "/register",
      planKey: paid ? p.key : "",
      highlighted: p.highlighted,
      items: [base[0], ...gen, ...rev, ...base.slice(1)],
    }
```

Replace with:
```tsx
    const base = pickArr(p.features, p.featuresEn, locale)
    const gen = p.includeDocGeneration
      ? pickArr(p.featuresDocGeneration, p.featuresDocGenerationEn, locale)
      : []
    const rev = p.includeDocReview
      ? pickArr(p.featuresDocReview, p.featuresDocReviewEn, locale)
      : []
    const tpl = p.includeDocTemplates
      ? pickArr(p.featuresDocTemplates, p.featuresDocTemplatesEn, locale)
      : []
    return {
      id: p.id,
      name: pick(p.name, p.nameEn, locale),
      price: Number.isInteger(gel) ? String(gel) : gel.toFixed(2),
      badge: p.highlighted ? s.popular : "",
      ctaText: paid ? s.join : s.start,
      ctaHref: paid ? "/billing" : "/register",
      planKey: paid ? p.key : "",
      highlighted: p.highlighted,
      items: [base[0], ...gen, ...rev, ...tpl, ...base.slice(1)],
    }
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expected clean.

Manually: visit `/pricing` and the homepage pricing section, confirm plans with `includeDocTemplates: true` and non-empty `featuresDocTemplates` show the new bullet(s) in their feature list.

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/page.tsx src/components/site/PricingSection.tsx
git commit -m "feat: show templates feature bullets on pricing pages"
```

---

### Task 3: Service cards, services tab, and dictionary fixes (includes mislabel fix)

**Files:**
- Modify: `src/app/services/services-client.tsx:35, 330-334, 382-388`
- Modify: `src/components/site/service-cards.tsx:16-20`
- Modify: `src/lib/i18n/dictionaries.ts` (ka `profile`/`servicesModal` blocks, en equivalents)

**Interfaces:** none new — reads `flags.templates` (Phase 1 Task 7).

- [ ] **Step 1: Add new dictionary keys (ka)**

In the ka `profile` block, current (line 256-257 area):
```ts
    documentsGenerated: "გენერირებული დოკუმენტები",
    documentsAnalyzed: "გაანალიზებული დოკუმენტები",
```
Add a sibling right after:
```ts
    documentsGenerated: "გენერირებული დოკუმენტები",
    documentsAnalyzed: "გაანალიზებული დოკუმენტები",
    documentsTemplated: "შექმნილი შაბლონები",
```

In the ka `servicesModal` block, current (lines 304-315):
```ts
  servicesModal: {
    sidebarHeading: "სერვისები",
    sidebarSubtitle: "აირჩიეთ სასურველი სერვისი",
    aiTab: "AI კონსულტაცია",
    aiSubtitle: "მე ვარ AI იურისტი და გეხმარებით იურიდიულ საკითხებში",
    templatesTab: "შაბლონის გენერირება",
    templatesHint: "აირჩიეთ სასურველი შაბლონი და დააგენერირეთ დოკუმენტი",
    templatesSearchPlaceholder: "ძებნა...",
    templatesNoResults: "შაბლონი ვერ მოიძებნა",
    generateCta: "გენერირება",
    warningLabel: "გაფრთხილება:",
  },
```

Replace with (fixes the mislabel — `templatesTab`/`templatesHint` now correctly describe the new static-template service; a new `generateTab` pair describes the narrowed AI-drafting service that `templatesTab` used to mislabel):
```ts
  servicesModal: {
    sidebarHeading: "სერვისები",
    sidebarSubtitle: "აირჩიეთ სასურველი სერვისი",
    aiTab: "AI კონსულტაცია",
    aiSubtitle: "მე ვარ AI იურისტი და გეხმარებით იურიდიულ საკითხებში",
    generateTab: "დოკუმენტის მომზადება (AI)",
    generateHint: "აღწერე შენი შემთხვევა და AI მოამზადებს დოკუმენტს",
    templatesTab: "მზა შაბლონები",
    templatesHint: "აირჩიეთ სასურველი შაბლონი და დააგენერირეთ დოკუმენტი",
    templatesSearchPlaceholder: "ძებნა...",
    templatesNoResults: "შაბლონი ვერ მოიძებნა",
    generateCta: "გენერირება",
    warningLabel: "გაფრთხილება:",
  },
```

- [ ] **Step 2: Same additions in the en block**

Current (lines 588-593 area, `profile`):
```ts
    documentsGenerated: "Documents generated",
    documentsAnalyzed: "Documents analyzed",
```
Add:
```ts
    documentsGenerated: "Documents generated",
    documentsAnalyzed: "Documents analyzed",
    documentsTemplated: "Templates created",
```

Current en `servicesModal` (lines 638-649):
```ts
  servicesModal: {
    sidebarHeading: "Services",
    sidebarSubtitle: "Choose the service you need",
    aiTab: "AI Consultation",
    aiSubtitle: "I'm your AI lawyer, here to help with legal matters",
    templatesTab: "Template Generation",
    templatesHint: "Pick a template and generate your document",
    templatesSearchPlaceholder: "Search...",
    templatesNoResults: "No templates found",
    generateCta: "Generate",
    warningLabel: "Notice:",
  },
```

Replace with:
```ts
  servicesModal: {
    sidebarHeading: "Services",
    sidebarSubtitle: "Choose the service you need",
    aiTab: "AI Consultation",
    aiSubtitle: "I'm your AI lawyer, here to help with legal matters",
    generateTab: "AI Document Drafting",
    generateHint: "Describe your case and AI will draft the document",
    templatesTab: "Ready-made Templates",
    templatesHint: "Pick a template and generate your document",
    templatesSearchPlaceholder: "Search...",
    templatesNoResults: "No templates found",
    generateCta: "Generate",
    warningLabel: "Notice:",
  },
```

- [ ] **Step 3: `services-client.tsx` — add a 4th tab, repoint the mislabeled one**

Current `Tab` type (line 35):
```tsx
type Tab = "ai" | "docs" | "templates";
```
Replace with:
```tsx
type Tab = "ai" | "docs" | "generate" | "templates";
```

Current tabs array (lines 330-334):
```tsx
  const tabs: { key: Tab; label: string; icon: LucideIcon; enabled: boolean }[] = [
    { key: "ai", label: sm.aiTab, icon: Sparkles, enabled: flags.chat },
    { key: "docs", label: d.documentAnalysis.title, icon: ScanSearch, enabled: flags.review },
    { key: "templates", label: sm.templatesTab, icon: FileText, enabled: flags.generate },
  ];
```
Replace with:
```tsx
  const tabs: { key: Tab; label: string; icon: LucideIcon; enabled: boolean }[] = [
    { key: "ai", label: sm.aiTab, icon: Sparkles, enabled: flags.chat },
    { key: "docs", label: d.documentAnalysis.title, icon: ScanSearch, enabled: flags.review },
    { key: "generate", label: sm.generateTab, icon: FileText, enabled: flags.generate },
    { key: "templates", label: sm.templatesTab, icon: FileText, enabled: flags.templates },
  ];
```

Current panel rendering (lines 382-388):
```tsx
              {activeTab === "ai" && flags.chat && <AiConsultPanel locale={locale} />}
              {activeTab === "docs" && flags.review && (
                <div className="p-6 overflow-y-auto">
                  <DocumentAnalysisPanel locale={locale} />
                </div>
              )}
              {activeTab === "templates" && flags.generate && <TemplatesPanel sm={sm} />}
```
Replace with (the old `"templates" && flags.generate && <TemplatesPanel>` branch — which actually renders links into `/generate?type=...` per the existing `TemplatesPanel` internals — becomes the `"generate"` tab's content; a NEW `"templates"` branch links into the real `/templates` page instead):
```tsx
              {activeTab === "ai" && flags.chat && <AiConsultPanel locale={locale} />}
              {activeTab === "docs" && flags.review && (
                <div className="p-6 overflow-y-auto">
                  <DocumentAnalysisPanel locale={locale} />
                </div>
              )}
              {activeTab === "generate" && flags.generate && <TemplatesPanel sm={sm} />}
              {activeTab === "templates" && flags.templates && (
                <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="text-sm text-muted-foreground max-w-sm">{sm.templatesHint}</p>
                  <Link href="/templates" className={buttonVariants({})}>
                    {sm.generateCta}
                  </Link>
                </div>
              )}
```

Before finalizing this step: check whether `services-client.tsx` already imports `Link` and `buttonVariants` (used by other tabs' CTAs) near the top of the file — if not, add `import Link from "next/link";` and `import { buttonVariants } from "@/components/ui/button";` to the existing import block. Also verify the existing `TemplatesPanel` component (previously rendered under the `"templates"` key, now under `"generate"`) still receives `sm` correctly — no change needed to `TemplatesPanel` itself, only which tab key triggers it.

- [ ] **Step 4: `service-cards.tsx` — add a 4th card**

Current (lines 16-20):
```tsx
  const items = [
    { key: "chat", icon: MessageCircle, label: d.servicesModal.aiTab, desc: d.servicesModal.aiSubtitle, enabled: flags.chat },
    { key: "review", icon: FolderSearch, label: d.documentAnalysis.title, desc: d.documentAnalysis.subtitle, enabled: flags.review },
    { key: "generate", icon: FileText, label: d.servicesModal.templatesTab, desc: d.servicesModal.templatesHint, enabled: flags.generate },
  ].filter((i) => i.enabled);
```

Replace with (the existing `generate` card entry now correctly points at `generateTab`/`generateHint` instead of the mislabeled `templatesTab`/`templatesHint`, and a new `templates` card is added):
```tsx
  const items = [
    { key: "chat", icon: MessageCircle, label: d.servicesModal.aiTab, desc: d.servicesModal.aiSubtitle, enabled: flags.chat },
    { key: "review", icon: FolderSearch, label: d.documentAnalysis.title, desc: d.documentAnalysis.subtitle, enabled: flags.review },
    { key: "generate", icon: FileText, label: d.servicesModal.generateTab, desc: d.servicesModal.generateHint, enabled: flags.generate },
    { key: "templates", icon: FileText, label: d.servicesModal.templatesTab, desc: d.servicesModal.templatesHint, enabled: flags.templates },
  ].filter((i) => i.enabled);
```

If `FileText` (lucide icon) is reused for both `generate` and `templates` cards, consider importing a distinct icon (e.g. `LayoutTemplate` from `lucide-react`) for the `templates` entry so the two cards are visually distinguishable at a glance — check the top of `service-cards.tsx` for its existing icon imports and add one if going this route; not required for correctness, purely a polish nice-to-have.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint` — expected clean.

Manually: visit `/services`, confirm 4 tabs now exist (AI, document review, AI drafting, templates), the "templates" tab links out to the real `/templates` page, and the homepage service-cards grid shows 4 cards when all flags are on. Toggle `flags.templates` off in `/admin` → Features and confirm both the tab and the homepage card disappear.

- [ ] **Step 6: Commit**

```bash
git add src/app/services/services-client.tsx src/components/site/service-cards.tsx src/lib/i18n/dictionaries.ts
git commit -m "feat: add templates entry to services nav, fix generate/templates label mixup"
```

---

### Task 4: Admin `PlansPanel.tsx` — full CRUD for the 4th field

**Files:**
- Modify: `src/components/admin/PlansPanel.tsx`

**Interfaces:** none new — writes `Plan.docTemplates`/`.includeDocTemplates`/`.featuresDocTemplates[En]` (Phase 1 Task 3) via `POST/PATCH /api/admin/plans` (Task 7 of this plan updates that route's schema).

- [ ] **Step 1: `Plan` type**

Current (lines 29-39, within the larger type):
```ts
  consultations: number
  includeDocGeneration: boolean
  docGeneration: number
  includeDocReview: boolean
  docReview: number
  features: string[]
  featuresEn: string[]
  featuresDocGeneration: string[]
  featuresDocGenerationEn: string[]
  featuresDocReview: string[]
  featuresDocReviewEn: string[]
```
Replace with:
```ts
  consultations: number
  includeDocGeneration: boolean
  docGeneration: number
  includeDocReview: boolean
  docReview: number
  includeDocTemplates: boolean
  docTemplates: number
  features: string[]
  featuresEn: string[]
  featuresDocGeneration: string[]
  featuresDocGenerationEn: string[]
  featuresDocReview: string[]
  featuresDocReviewEn: string[]
  featuresDocTemplates: string[]
  featuresDocTemplatesEn: string[]
```

- [ ] **Step 2: `BLANK` default**

Current (lines 47-55):
```ts
const BLANK: Plan = {
  id: "", key: "", name: "", nameEn: "", description: "", descriptionEn: "",
  priceMinor: 0, currency: "GEL", period: "month",
  consultations: 0, includeDocGeneration: true, docGeneration: 0, includeDocReview: true, docReview: 0,
  features: [], featuresEn: [],
  featuresDocGeneration: [], featuresDocGenerationEn: [],
  featuresDocReview: [], featuresDocReviewEn: [],
  isFree: false, highlighted: false, visible: true, active: true, order: 0,
}
```
Replace with:
```ts
const BLANK: Plan = {
  id: "", key: "", name: "", nameEn: "", description: "", descriptionEn: "",
  priceMinor: 0, currency: "GEL", period: "month",
  consultations: 0, includeDocGeneration: true, docGeneration: 0, includeDocReview: true, docReview: 0,
  includeDocTemplates: true, docTemplates: 0,
  features: [], featuresEn: [],
  featuresDocGeneration: [], featuresDocGenerationEn: [],
  featuresDocReview: [], featuresDocReviewEn: [],
  featuresDocTemplates: [], featuresDocTemplatesEn: [],
  isFree: false, highlighted: false, visible: true, active: true, order: 0,
}
```

- [ ] **Step 3: Default feature-text lookup maps**

Current (lines 58-73):
```ts
const DEFAULT_GEN_KA: Record<string, string> = {
  standard: "19 შაბლონის გენერირება",
  premium: "შეუზღუდავი შაბლონის გენერირება",
}
const DEFAULT_GEN_EN: Record<string, string> = {
  standard: "19 template generations",
  premium: "Unlimited template generations",
}
const DEFAULT_REV_KA: Record<string, string> = {
  standard: "9 დოკუმენტის შემოწმება",
  premium: "99 დოკუმენტის/ხელშეკრულების შემოწმება",
}
const DEFAULT_REV_EN: Record<string, string> = {
  standard: "9 document reviews",
  premium: "99 document/contract reviews",
}
```
Add a matching pair immediately after:
```ts
const DEFAULT_TPL_KA: Record<string, string> = {
  standard: "19 დოკუმენტის შაბლონი",
  premium: "შეუზღუდავი დოკუმენტის შაბლონი",
}
const DEFAULT_TPL_EN: Record<string, string> = {
  standard: "19 document templates",
  premium: "Unlimited document templates",
}
```

- [ ] **Step 4: Table column header + row cell**

Current header (line 148):
```tsx
<th>კონს./დოკ.გ/მიმ.</th>
```
Replace with:
```tsx
<th>კონს./დოკ.გ/მიმ./შაბ.</th>
```

Current row cell (lines 165-175):
```tsx
<td>
  <div className="text-muted-foreground text-xs">{p.consultations} კონს.</div>
  <div className="flex flex-wrap gap-1 mt-1">
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.includeDocGeneration ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      შაბლ: {p.includeDocGeneration ? "✓" : "✗"}
    </span>
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.includeDocReview ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      დოკ: {p.includeDocReview ? "✓" : "✗"}
    </span>
  </div>
</td>
```
Replace with (note: existing badge labeled "შაბლ" actually refers to `includeDocGeneration` — leave its label as-is to avoid an unrelated rename churn in this diff; the new badge for the real templates service uses a distinct label "შაბ." to avoid confusion):
```tsx
<td>
  <div className="text-muted-foreground text-xs">{p.consultations} კონს.</div>
  <div className="flex flex-wrap gap-1 mt-1">
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.includeDocGeneration ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      შაბლ: {p.includeDocGeneration ? "✓" : "✗"}
    </span>
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.includeDocReview ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      დოკ: {p.includeDocReview ? "✓" : "✗"}
    </span>
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.includeDocTemplates ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      შაბ.: {p.includeDocTemplates ? "✓" : "✗"}
    </span>
  </div>
</td>
```

- [ ] **Step 5: `PlanDialog` local textarea state**

Current (lines 237-240):
```ts
const [featuresGenText, setFeaturesGenText] = useState("")
const [featuresGenEnText, setFeaturesGenEnText] = useState("")
const [featuresRevText, setFeaturesRevText] = useState("")
const [featuresRevEnText, setFeaturesRevEnText] = useState("")
```
Add:
```ts
const [featuresGenText, setFeaturesGenText] = useState("")
const [featuresGenEnText, setFeaturesGenEnText] = useState("")
const [featuresRevText, setFeaturesRevText] = useState("")
const [featuresRevEnText, setFeaturesRevEnText] = useState("")
const [featuresTplText, setFeaturesTplText] = useState("")
const [featuresTplEnText, setFeaturesTplEnText] = useState("")
```

- [ ] **Step 6: Sync-on-open effect**

Current (lines 251-254):
```ts
setFeaturesGenText((plan.featuresDocGeneration ?? []).join("\n"))
setFeaturesGenEnText((plan.featuresDocGenerationEn ?? []).join("\n"))
setFeaturesRevText((plan.featuresDocReview ?? []).join("\n"))
setFeaturesRevEnText((plan.featuresDocReviewEn ?? []).join("\n"))
```
Add:
```ts
setFeaturesGenText((plan.featuresDocGeneration ?? []).join("\n"))
setFeaturesGenEnText((plan.featuresDocGenerationEn ?? []).join("\n"))
setFeaturesRevText((plan.featuresDocReview ?? []).join("\n"))
setFeaturesRevEnText((plan.featuresDocReviewEn ?? []).join("\n"))
setFeaturesTplText((plan.featuresDocTemplates ?? []).join("\n"))
setFeaturesTplEnText((plan.featuresDocTemplatesEn ?? []).join("\n"))
```

- [ ] **Step 7: Submit payload in `save()`**

Current (lines 262-274):
```ts
async function save() {
  setSaving(true)
  const split = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean)
  const payload = {
    ...form,
    priceMinor: Math.round((parseFloat(priceGel) || 0) * 100),
    features: split(featuresText),
    featuresEn: split(featuresEnText),
    featuresDocGeneration: split(featuresGenText),
    featuresDocGenerationEn: split(featuresGenEnText),
    featuresDocReview: split(featuresRevText),
    featuresDocReviewEn: split(featuresRevEnText),
  }
```
Replace with:
```ts
async function save() {
  setSaving(true)
  const split = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean)
  const payload = {
    ...form,
    priceMinor: Math.round((parseFloat(priceGel) || 0) * 100),
    features: split(featuresText),
    featuresEn: split(featuresEnText),
    featuresDocGeneration: split(featuresGenText),
    featuresDocGenerationEn: split(featuresGenEnText),
    featuresDocReview: split(featuresRevText),
    featuresDocReviewEn: split(featuresRevEnText),
    featuresDocTemplates: split(featuresTplText),
    featuresDocTemplatesEn: split(featuresTplEnText),
  }
```
(`form.docTemplates`/`form.includeDocTemplates` are already carried through via the `...form` spread — same as `docGeneration`/`includeDocGeneration` today — since `form`'s shape is the `Plan` type from Step 1.)

- [ ] **Step 8: Form fields — checkbox/number grid**

Current (lines 341-382, the `sm:grid-cols-3` block with consultations/docGeneration/docReview):
```tsx
<div className="grid gap-4 sm:grid-cols-3">
  <div className="grid gap-2">
    <Label>კონსულტაცია</Label>
    <Input type="number" min={0} value={form.consultations} onChange={(e) => set("consultations", Number(e.target.value))} />
  </div>
  <div className="grid gap-2">
    <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      <input
        type="checkbox"
        checked={form.includeDocGeneration}
        onChange={(e) => {
          const checked = e.target.checked
          set("includeDocGeneration", checked)
          if (checked && !featuresGenText.trim()) {
            setFeaturesGenText(DEFAULT_GEN_KA[form.key] ?? "")
            setFeaturesGenEnText(DEFAULT_GEN_EN[form.key] ?? "")
          }
        }}
      />
      შაბლ. გენ. (ჩართული)
    </label>
    <Input type="number" min={0} value={form.docGeneration} disabled={!form.includeDocGeneration} onChange={(e) => set("docGeneration", Number(e.target.value))} className={!form.includeDocGeneration ? "opacity-40" : ""} />
  </div>
  <div className="grid gap-2">
    <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      <input
        type="checkbox"
        checked={form.includeDocReview}
        onChange={(e) => {
          const checked = e.target.checked
          set("includeDocReview", checked)
          if (checked && !featuresRevText.trim()) {
            setFeaturesRevText(DEFAULT_REV_KA[form.key] ?? "")
            setFeaturesRevEnText(DEFAULT_REV_EN[form.key] ?? "")
          }
        }}
      />
      დოკ. მიმ. (ჩართული)
    </label>
    <Input type="number" min={0} value={form.docReview} disabled={!form.includeDocReview} onChange={(e) => set("docReview", Number(e.target.value))} className={!form.includeDocReview ? "opacity-40" : ""} />
  </div>
</div>
```

Replace with (grid changes from a fixed 3-column to a responsive `sm:grid-cols-2 lg:grid-cols-4` so the new 4th field fits without cramming 4 into 3 columns; a 4th `<div className="grid gap-2">` block is added, mirroring the docReview block exactly):
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <div className="grid gap-2">
    <Label>კონსულტაცია</Label>
    <Input type="number" min={0} value={form.consultations} onChange={(e) => set("consultations", Number(e.target.value))} />
  </div>
  <div className="grid gap-2">
    <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      <input
        type="checkbox"
        checked={form.includeDocGeneration}
        onChange={(e) => {
          const checked = e.target.checked
          set("includeDocGeneration", checked)
          if (checked && !featuresGenText.trim()) {
            setFeaturesGenText(DEFAULT_GEN_KA[form.key] ?? "")
            setFeaturesGenEnText(DEFAULT_GEN_EN[form.key] ?? "")
          }
        }}
      />
      შაბლ. გენ. (ჩართული)
    </label>
    <Input type="number" min={0} value={form.docGeneration} disabled={!form.includeDocGeneration} onChange={(e) => set("docGeneration", Number(e.target.value))} className={!form.includeDocGeneration ? "opacity-40" : ""} />
  </div>
  <div className="grid gap-2">
    <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      <input
        type="checkbox"
        checked={form.includeDocReview}
        onChange={(e) => {
          const checked = e.target.checked
          set("includeDocReview", checked)
          if (checked && !featuresRevText.trim()) {
            setFeaturesRevText(DEFAULT_REV_KA[form.key] ?? "")
            setFeaturesRevEnText(DEFAULT_REV_EN[form.key] ?? "")
          }
        }}
      />
      დოკ. მიმ. (ჩართული)
    </label>
    <Input type="number" min={0} value={form.docReview} disabled={!form.includeDocReview} onChange={(e) => set("docReview", Number(e.target.value))} className={!form.includeDocReview ? "opacity-40" : ""} />
  </div>
  <div className="grid gap-2">
    <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      <input
        type="checkbox"
        checked={form.includeDocTemplates}
        onChange={(e) => {
          const checked = e.target.checked
          set("includeDocTemplates", checked)
          if (checked && !featuresTplText.trim()) {
            setFeaturesTplText(DEFAULT_TPL_KA[form.key] ?? "")
            setFeaturesTplEnText(DEFAULT_TPL_EN[form.key] ?? "")
          }
        }}
      />
      შაბ. (ჩართული)
    </label>
    <Input type="number" min={0} value={form.docTemplates} disabled={!form.includeDocTemplates} onChange={(e) => set("docTemplates", Number(e.target.value))} className={!form.includeDocTemplates ? "opacity-40" : ""} />
  </div>
</div>
```

- [ ] **Step 9: Feature textareas**

Current (lines 393-412, the two `sm:grid-cols-2` blocks for gen/rev feature text):
```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <div className="grid gap-2">
    <Label className={!form.includeDocGeneration ? "text-muted-foreground" : ""}>შაბლ. გენ. KA {!form.includeDocGeneration && "(გამორთ.)"}</Label>
    <Textarea rows={2} value={featuresGenText} onChange={(e) => setFeaturesGenText(e.target.value)} disabled={!form.includeDocGeneration} className={!form.includeDocGeneration ? "opacity-40" : ""} placeholder={"19 შაბლონის გენერირება"} />
  </div>
  <div className="grid gap-2">
    <Label className={!form.includeDocGeneration ? "text-muted-foreground" : ""}>Template Gen. EN {!form.includeDocGeneration && "(disabled)"}</Label>
    <Textarea rows={2} value={featuresGenEnText} onChange={(e) => setFeaturesGenEnText(e.target.value)} disabled={!form.includeDocGeneration} className={!form.includeDocGeneration ? "opacity-40" : ""} placeholder={"19 template generations"} />
  </div>
</div>
<div className="grid gap-4 sm:grid-cols-2">
  <div className="grid gap-2">
    <Label className={!form.includeDocReview ? "text-muted-foreground" : ""}>დოკ. მიმ. KA {!form.includeDocReview && "(გამორთ.)"}</Label>
    <Textarea rows={2} value={featuresRevText} onChange={(e) => setFeaturesRevText(e.target.value)} disabled={!form.includeDocReview} className={!form.includeDocReview ? "opacity-40" : ""} placeholder={"9 დოკუმენტის შემოწმება"} />
  </div>
  <div className="grid gap-2">
    <Label className={!form.includeDocReview ? "text-muted-foreground" : ""}>Doc Review EN {!form.includeDocReview && "(disabled)"}</Label>
    <Textarea rows={2} value={featuresRevEnText} onChange={(e) => setFeaturesRevEnText(e.target.value)} disabled={!form.includeDocReview} className={!form.includeDocReview ? "opacity-40" : ""} placeholder={"9 document reviews"} />
  </div>
</div>
```

Add a 3rd matching block immediately after:
```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <div className="grid gap-2">
    <Label className={!form.includeDocTemplates ? "text-muted-foreground" : ""}>შაბ. KA {!form.includeDocTemplates && "(გამორთ.)"}</Label>
    <Textarea rows={2} value={featuresTplText} onChange={(e) => setFeaturesTplText(e.target.value)} disabled={!form.includeDocTemplates} className={!form.includeDocTemplates ? "opacity-40" : ""} placeholder={"19 დოკუმენტის შაბლონი"} />
  </div>
  <div className="grid gap-2">
    <Label className={!form.includeDocTemplates ? "text-muted-foreground" : ""}>Templates EN {!form.includeDocTemplates && "(disabled)"}</Label>
    <Textarea rows={2} value={featuresTplEnText} onChange={(e) => setFeaturesTplEnText(e.target.value)} disabled={!form.includeDocTemplates} className={!form.includeDocTemplates ? "opacity-40" : ""} placeholder={"19 document templates"} />
  </div>
</div>
```

- [ ] **Step 10: Verify**

Run: `npx tsc --noEmit && npm run lint` — expected clean (will need Task 7's API schema update to actually persist — test end-to-end after that task).

- [ ] **Step 11: Commit**

```bash
git add src/components/admin/PlansPanel.tsx
git commit -m "feat: add docTemplates CRUD fields to admin PlansPanel"
```

---

### Task 5: Admin `admin-dashboard.tsx` — table column + fix edit-modal gap

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`

**Interfaces:** none new.

- [ ] **Step 1: `UserRow` type**

Current (lines 65-76):
```ts
export type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  plan: string;
  consultationsRemaining: number;
  docGenerationRemaining: number;
  docReviewRemaining: number;
  createdAt: string | null;
};
```
Replace with:
```ts
export type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  plan: string;
  consultationsRemaining: number;
  docGenerationRemaining: number;
  docReviewRemaining: number;
  docTemplatesRemaining: number;
  createdAt: string | null;
};
```

- [ ] **Step 2: Table column headers**

Current (lines 298-307):
```tsx
<tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium">
  <th>მომხმარებელი</th>
  <th>როლი</th>
  <th>გეგმა</th>
  <th>კონს.</th>
  <th>დოკ.გ</th>
  <th>მიმ.</th>
  <th>რეგ.</th>
  <th className="text-right">ქმედება</th>
</tr>
```
Replace with:
```tsx
<tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-medium">
  <th>მომხმარებელი</th>
  <th>როლი</th>
  <th>გეგმა</th>
  <th>კონს.</th>
  <th>დოკ.გ</th>
  <th>მიმ.</th>
  <th>შაბ.</th>
  <th>რეგ.</th>
  <th className="text-right">ქმედება</th>
</tr>
```

- [ ] **Step 3: Table row cells**

Current (lines 320-323):
```tsx
<td>{u.plan}</td>
<td>{u.consultationsRemaining}</td>
<td>{u.docGenerationRemaining}</td>
<td>{u.docReviewRemaining}</td>
```
Replace with:
```tsx
<td>{u.plan}</td>
<td>{u.consultationsRemaining}</td>
<td>{u.docGenerationRemaining}</td>
<td>{u.docReviewRemaining}</td>
<td>{u.docTemplatesRemaining}</td>
```

- [ ] **Step 4: Fix the edit-modal gap — add all 3 non-consultation counters**

This fixes the pre-existing bug confirmed during research: the edit modal can currently only edit `consultationsRemaining`, even though the table displays `docGenerationRemaining`/`docReviewRemaining` as read-only. Since we're adding a 4th counter here anyway, fix all 3 missing counters' editability in one pass rather than adding a 4th field to an already-incomplete modal.

Current state declarations (lines 363-369):
```ts
const [name, setName] = useState("");
const [role, setRole] = useState<"user" | "admin">("user");
const [plan, setPlan] = useState<string>("free");
const [remaining, setRemaining] = useState("0");
const [saving, setSaving] = useState(false);
const [syncedId, setSyncedId] = useState<string | null>(null);
const [planOptions, setPlanOptions] = useState<{ key: string; name: string }[]>([]);
```
Replace with:
```ts
const [name, setName] = useState("");
const [role, setRole] = useState<"user" | "admin">("user");
const [plan, setPlan] = useState<string>("free");
const [remaining, setRemaining] = useState("0");
const [genRemaining, setGenRemaining] = useState("0");
const [reviewRemaining, setReviewRemaining] = useState("0");
const [templatesRemaining, setTemplatesRemaining] = useState("0");
const [saving, setSaving] = useState(false);
const [syncedId, setSyncedId] = useState<string | null>(null);
const [planOptions, setPlanOptions] = useState<{ key: string; name: string }[]>([]);
```

Current sync-on-open (lines 380-386):
```ts
if (user && user.id !== syncedId) {
  setSyncedId(user.id);
  setName(user.name);
  setRole(user.role);
  setPlan(user.plan);
  setRemaining(String(user.consultationsRemaining));
}
```
Replace with:
```ts
if (user && user.id !== syncedId) {
  setSyncedId(user.id);
  setName(user.name);
  setRole(user.role);
  setPlan(user.plan);
  setRemaining(String(user.consultationsRemaining));
  setGenRemaining(String(user.docGenerationRemaining));
  setReviewRemaining(String(user.docReviewRemaining));
  setTemplatesRemaining(String(user.docTemplatesRemaining));
}
```

Current save payload (lines 388-403):
```ts
async function save() {
  if (!user) return;
  setSaving(true);
  try {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, plan, consultationsRemaining: Number(remaining) }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error ?? "შენახვა ვერ მოხერხდა"); return; }
    toast.success("შენახულია");
    onSaved({ ...user, name: data.name, role: data.role, plan: data.plan, consultationsRemaining: data.consultationsRemaining });
  } catch { toast.error("ქსელის შეცდომა"); }
  finally { setSaving(false); }
}
```
Replace with:
```ts
async function save() {
  if (!user) return;
  setSaving(true);
  try {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        role,
        plan,
        consultationsRemaining: Number(remaining),
        docGenerationRemaining: Number(genRemaining),
        docReviewRemaining: Number(reviewRemaining),
        docTemplatesRemaining: Number(templatesRemaining),
      }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error ?? "შენახვა ვერ მოხერხდა"); return; }
    toast.success("შენახულია");
    onSaved({
      ...user,
      name: data.name,
      role: data.role,
      plan: data.plan,
      consultationsRemaining: data.consultationsRemaining,
      docGenerationRemaining: data.docGenerationRemaining,
      docReviewRemaining: data.docReviewRemaining,
      docTemplatesRemaining: data.docTemplatesRemaining,
    });
  } catch { toast.error("ქსელის შეცდომა"); }
  finally { setSaving(false); }
}
```

Note: this requires `PATCH /api/admin/users/[id]` (not read in this plan's research — check `src/app/api/admin/users/[id]/route.ts` before this step) to accept and persist `docGenerationRemaining`/`docReviewRemaining`/`docTemplatesRemaining` in its Zod schema and update payload, and return them in its response — if that route currently only accepts/returns `consultationsRemaining` (matching today's modal), extend its schema the same way `AdminUserUpdateSchema` in `src/lib/validators.ts` is structured (check that file's existing shape for the established pattern first).

Current form JSX (lines 438-441, the single input field):
```tsx
<div className="grid gap-2">
  <Label htmlFor="edit-remaining">დარჩ. კონსულტაცია</Label>
  <Input id="edit-remaining" type="number" min={0} value={remaining} onChange={(e) => setRemaining(e.target.value)} />
</div>
```
Replace with:
```tsx
<div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
  <div className="grid gap-2">
    <Label htmlFor="edit-remaining">დარჩ. კონსულტაცია</Label>
    <Input id="edit-remaining" type="number" min={0} value={remaining} onChange={(e) => setRemaining(e.target.value)} />
  </div>
  <div className="grid gap-2">
    <Label htmlFor="edit-gen-remaining">დარჩ. დოკ. გენ.</Label>
    <Input id="edit-gen-remaining" type="number" min={0} value={genRemaining} onChange={(e) => setGenRemaining(e.target.value)} />
  </div>
  <div className="grid gap-2">
    <Label htmlFor="edit-review-remaining">დარჩ. დოკ. მიმოხ.</Label>
    <Input id="edit-review-remaining" type="number" min={0} value={reviewRemaining} onChange={(e) => setReviewRemaining(e.target.value)} />
  </div>
  <div className="grid gap-2">
    <Label htmlFor="edit-templates-remaining">დარჩ. შაბლონი</Label>
    <Input id="edit-templates-remaining" type="number" min={0} value={templatesRemaining} onChange={(e) => setTemplatesRemaining(e.target.value)} />
  </div>
</div>
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint` — will need `/api/admin/users/[id]` extended (see note in Step 4) before this compiles/works end-to-end; read that route file, extend its schema/update/response the same way, then re-verify.

Manually: in `/admin`, open a user's edit dialog, confirm all 4 remaining-quota fields are editable and independently save correctly, and the table's new "შაბ." column reflects the change after save.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/admin-dashboard.tsx src/app/api/admin/users/[id]/route.ts src/lib/validators.ts
git commit -m "fix: admin edit modal can now edit all 4 quota counters, not just consultations"
```

---

### Task 6: Admin `page.tsx` row mapping

**Files:**
- Modify: `src/app/admin/page.tsx:68-79`

**Interfaces:** none new.

- [ ] **Step 1: Add the field to the row mapper**

Current (lines 68-79):
```ts
const userRows: UserRow[] = users.map((u) => ({
  id: String((u as { _id: unknown })._id),
  name: u.name,
  email: u.email,
  image: u.image ?? null,
  role: (u.role ?? "user") as "user" | "admin",
  plan: (u.plan ?? "free") as string,
  consultationsRemaining: u.consultationsRemaining ?? 0,
  docGenerationRemaining: u.docGenerationRemaining ?? 0,
  docReviewRemaining: u.docReviewRemaining ?? 0,
  createdAt: (u as { createdAt?: Date }).createdAt?.toISOString() ?? null,
}));
```
Replace with:
```ts
const userRows: UserRow[] = users.map((u) => ({
  id: String((u as { _id: unknown })._id),
  name: u.name,
  email: u.email,
  image: u.image ?? null,
  role: (u.role ?? "user") as "user" | "admin",
  plan: (u.plan ?? "free") as string,
  consultationsRemaining: u.consultationsRemaining ?? 0,
  docGenerationRemaining: u.docGenerationRemaining ?? 0,
  docReviewRemaining: u.docReviewRemaining ?? 0,
  docTemplatesRemaining: u.docTemplatesRemaining ?? 0,
  createdAt: (u as { createdAt?: Date }).createdAt?.toISOString() ?? null,
}));
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expected clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: include docTemplatesRemaining in admin user row mapping"
```

---

### Task 7: Admin plans API schema

**Files:**
- Modify: `src/app/api/admin/plans/route.ts:22-32`
- Modify: `src/app/api/admin/plans/[id]/route.ts` (read first — not covered by this plan's research; mirror whatever schema `route.ts` uses)

**Interfaces:** none new — this is what makes Task 4's admin UI actually persist.

- [ ] **Step 1: Extend the create-plan schema**

Current (lines 22-32):
```ts
consultations: z.coerce.number().int().min(0).max(1_000_000).default(0),
includeDocGeneration: z.boolean().default(true),
docGeneration: z.coerce.number().int().min(0).max(1_000_000).default(0),
includeDocReview: z.boolean().default(true),
docReview: z.coerce.number().int().min(0).max(1_000_000).default(0),
features: z.array(z.string().trim().max(200)).max(30).default([]),
featuresEn: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocGeneration: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocGenerationEn: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocReview: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocReviewEn: z.array(z.string().trim().max(200)).max(30).default([]),
```
Replace with:
```ts
consultations: z.coerce.number().int().min(0).max(1_000_000).default(0),
includeDocGeneration: z.boolean().default(true),
docGeneration: z.coerce.number().int().min(0).max(1_000_000).default(0),
includeDocReview: z.boolean().default(true),
docReview: z.coerce.number().int().min(0).max(1_000_000).default(0),
includeDocTemplates: z.boolean().default(true),
docTemplates: z.coerce.number().int().min(0).max(1_000_000).default(0),
features: z.array(z.string().trim().max(200)).max(30).default([]),
featuresEn: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocGeneration: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocGenerationEn: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocReview: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocReviewEn: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocTemplates: z.array(z.string().trim().max(200)).max(30).default([]),
featuresDocTemplatesEn: z.array(z.string().trim().max(200)).max(30).default([]),
```

- [ ] **Step 2: Mirror in the update route**

Read `src/app/api/admin/plans/[id]/route.ts` — if it defines its own separate Zod schema (rather than importing `PlanSchema` from `route.ts`), add the identical 4 fields (`includeDocTemplates`, `docTemplates`, `featuresDocTemplates`, `featuresDocTemplatesEn`) in the same style. If it already imports/reuses the schema from `route.ts`, no separate change is needed there.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint` — expected clean.

Manually: in `/admin` → Plans, edit a plan, toggle the new "შაბ. (ჩართული)" checkbox, set a number, fill the KA/EN feature textareas, save — confirm it persists (reload the page, re-open the dialog, values are retained), and that `/pricing` reflects the change.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/plans/route.ts src/app/api/admin/plans/[id]/route.ts
git commit -m "feat: accept docTemplates fields in admin plans API"
```

---

### Task 8 (optional, low priority): Admin stats chart parity

**Files:**
- Modify: `src/components/admin/OverviewPanel.tsx` (only if pursuing this)
- Modify: `src/app/api/admin/stats/route.ts` (only if pursuing this)

Per the design spec, this was explicitly marked optional — today's admin overview only time-series-charts `consultations`, not `docGeneration`/`docReview` usage either, so adding a `docTemplates` chart would be net-new scope beyond parity with the other 2 services, not a gap being closed. **Skip this task** unless specifically requested later; noted here only so it isn't silently forgotten if the user asks for admin analytics parity across all 4 services in a future round.

---

### Task 9: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: all clean.

- [ ] **Step 2: Full manual walkthrough**

As a regular user: `/dashboard` shows 4 quota cards, `/pricing` shows templates features, `/services` shows 4 tabs/cards, `/templates` and `/generate` both work independently.

As an admin: `/admin` → Users table shows 4 quota columns, edit modal can edit all 4, Plans panel can configure `docTemplates` fully (checkbox, number, KA/EN feature bullets), Features panel can toggle `templates` on/off and it correctly hides/shows the service across dashboard/pricing/services/nav.

- [ ] **Step 3: Report back**

Confirm to the user: the 4-service split is fully live end-to-end — `/generate` (AI, 2 types), `/templates` (static, 4 types), each with independent quota, independent admin controls, and consistent nav/pricing/dashboard visibility. Note the one explicitly-skipped item (admin stats chart parity, Task 8) in case they want it later.
