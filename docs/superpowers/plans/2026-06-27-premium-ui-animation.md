# Premium UI & Animation Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium animation system, sharper hero image, animated scales-of-justice SVG, serif headings, and hover micro-interactions to the homepage and site footer — zero new npm dependencies.

**Architecture:** Pure CSS keyframes for always-on animations (hero entrance, float, scales sway, shimmer). A 20-line `AnimateIn` client component using `IntersectionObserver` triggers scroll-based fade-up per card. All hover effects are CSS classes. RSC page.tsx stays a server component; only `AnimateIn` and the existing `PricingSection` are client components.

**Tech Stack:** Next.js 16 App Router (RSC), React 19, Tailwind v4, CSS keyframes, IntersectionObserver API

## Global Constraints

- No new npm dependencies
- `page.tsx` must remain a Server Component (no `"use client"`)
- All animations must be disabled under `prefers-reduced-motion: reduce`
- Georgian script must render correctly (Noto Serif Georgian is already loaded)
- Tailwind v4 syntax — use `@layer base` and raw CSS keyframes in `globals.css`, not `tailwind.config.js`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/globals.css` | Modify | Keyframes, animation utilities, heading font, hover classes, AnimateIn CSS states, footer link CSS |
| `src/components/site/AnimateIn.tsx` | **Create** | Scroll-triggered IntersectionObserver wrapper (client) |
| `src/app/page.tsx` | Modify | Hero filter + float + entrance anims + scales SVG + AnimateIn wrapping |
| `src/components/site/PricingSection.tsx` | Modify | AnimateIn wrapping + shimmer badge |
| `src/components/site/footer.tsx` | Modify | Footer link underline hover |

---

## Task 1: CSS Foundation — Keyframes, Utilities, Font, Hover

**Files:**
- Modify: `src/app/globals.css`

**What this task adds:**
- `@keyframes` for all animations
- Utility classes (`.animate-fade-up`, `.animate-fade-in`, `.animate-float`, `.animate-scale-sway`)
- Animation delay helpers (`.delay-150` … `.delay-600`)
- Serif heading font mapping
- `.card-hover` and `.btn-hover` CSS classes
- `.footer-link` underline animation
- `[data-animate]` CSS states for `AnimateIn` component

**Interfaces:**
- Produces: All CSS classes consumed by Tasks 2–6

- [ ] **Step 1: Open `src/app/globals.css` and append the following block after the existing `@layer base { }` block (at the end of the file).**

The complete addition — paste this verbatim at the end of the file:

```css
/* ── Animation keyframes ─────────────────────────────────────────────────── */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0);   }
  50%       { transform: translateY(-8px); }
}

@keyframes scale-sway {
  0%, 100% { transform: rotate(-2.5deg); }
  50%       { transform: rotate(2.5deg);  }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

/* ── Animation utility classes ───────────────────────────────────────────── */
.animate-fade-up {
  animation: fade-up 0.6s ease-out both;
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out both;
}
.animate-float {
  animation: float 7s ease-in-out infinite;
}
/* Combined: fade-in once, then float forever.
   Two separate classes would cascade-override each other's `animation` property. */
.animate-float-in {
  animation: fade-in 0.5s ease-out both, float 7s ease-in-out infinite;
}
.animate-scale-sway {
  animation: scale-sway 4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center top;
}

/* ── Animation delays ────────────────────────────────────────────────────── */
.delay-150 { animation-delay: 150ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }
.delay-600 { animation-delay: 600ms; }

/* ── Reduced-motion: kill all custom animations ──────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up,
  .animate-fade-in,
  .animate-float,
  .animate-float-in,
  .animate-scale-sway {
    animation: none;
  }
}

/* ── Heading font — always Noto Serif Georgian regardless of admin choice ── */
@layer base {
  h1, h2, h3 {
    font-family: var(--font-noto-serif), Georgia, serif;
  }
}

/* ── Card hover micro-interaction ────────────────────────────────────────── */
.card-hover {
  transition: transform 250ms ease-out, box-shadow 250ms ease-out, border-color 250ms ease-out;
}
.card-hover:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 8px 32px oklch(0.366 0.165 264 / 0.12);
  border-color: oklch(0.366 0.165 264 / 0.35);
}

/* ── Button hover micro-interaction ─────────────────────────────────────── */
.btn-hover {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out, opacity 200ms ease-out;
}
.btn-hover:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px oklch(0.366 0.165 264 / 0.22);
}

/* ── Footer link underline slide-in ─────────────────────────────────────── */
.footer-link {
  position: relative;
}
.footer-link::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: white;
  transition: width 200ms ease-out;
}
.footer-link:hover::after {
  width: 100%;
}

/* ── AnimateIn scroll-trigger states ─────────────────────────────────────── */
[data-animate]:not([data-visible]) {
  opacity: 0;
  transform: translateY(16px);
}
[data-animate][data-visible] {
  animation: fade-up 0.6s ease-out both;
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors. If `@layer base` used twice causes a warning, it is fine — Tailwind v4 merges them.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add animation keyframes, heading serif font, hover CSS"
```

---

## Task 2: AnimateIn Scroll-Trigger Component

**Files:**
- Create: `src/components/site/AnimateIn.tsx`

**Interfaces:**
- Produces: `AnimateIn` component used by Tasks 3–5
  - Props: `children: React.ReactNode`, `delay?: number` (ms, default 0), `className?: string`
  - Renders a `<div>` with `data-animate` attribute; adds `data-visible` once the element enters the viewport (IntersectionObserver threshold 0.12). The CSS from Task 1 animates the transition.

- [ ] **Step 1: Create the file**

`src/components/site/AnimateIn.tsx`:

```tsx
"use client"

import { useEffect, useRef, useState } from "react"

export function AnimateIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-animate=""
      data-visible={visible ? "" : undefined}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/site/AnimateIn.tsx
git commit -m "feat: add AnimateIn scroll-trigger client component"
```

---

## Task 3: Hero Section — Image, Float, Entrance Animations, Scales SVG

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `AnimateIn` from Task 2, CSS classes from Task 1
- Produces: enhanced hero section visible in browser

**What changes:**
1. Hero `<img>` filter — more vivid gold + drop-shadow glow
2. Statue wrapper — `animate-float` class + `animate-fade-in delay-150`
3. Hero `<h1>` — `animate-fade-up` class
4. Hero `<p>` subtitle — `animate-fade-up delay-150` class
5. Scales of justice SVG — added at bottom of text column with `animate-fade-up delay-400`

- [ ] **Step 1: Update the hero `<img>` — change the filter and opacity**

Find this block in `src/app/page.tsx` (around line 125–133):

```tsx
<div className="absolute inset-y-0 right-0 w-full lg:w-[62%] flex items-end justify-center pointer-events-none select-none">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src="/kartlis_deda_5.png"
    alt=""
    aria-hidden="true"
    className="h-full w-auto object-contain opacity-[0.82] mix-blend-screen"
    style={{ filter: "invert(1) sepia(1) saturate(3.5) hue-rotate(8deg) contrast(1.4) brightness(1.12)" }}
  />
</div>
```

Replace with:

```tsx
<div className="absolute inset-y-0 right-0 w-full lg:w-[62%] flex items-end justify-center pointer-events-none select-none animate-float-in">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src="/kartlis_deda_5.png"
    alt=""
    aria-hidden="true"
    className="h-full w-auto object-contain opacity-[0.96] mix-blend-screen"
    style={{ filter: "invert(1) sepia(1) saturate(4.2) hue-rotate(6deg) contrast(1.6) brightness(1.08) drop-shadow(0 0 40px oklch(0.65 0.13 78 / 0.4))" }}
  />
</div>
```

- [ ] **Step 2: Add entrance animation classes to the hero h1 and subtitle p**

Find (around line 139–146):

```tsx
<div className="flex flex-col justify-center min-h-[560px] py-12 lg:py-16 max-w-[620px]">
  <h1 className="text-[58px] sm:text-[68px] lg:text-[76px] font-bold text-white leading-none tracking-tight mb-5 whitespace-nowrap">
    {heroTitle}
  </h1>
  <p className="text-xl md:text-2xl font-semibold text-gold leading-snug">
    {heroSubtitle}
  </p>
</div>
```

Replace with:

```tsx
<div className="flex flex-col justify-center min-h-[560px] py-12 lg:py-16 max-w-[620px]">
  <h1 className="text-[58px] sm:text-[68px] lg:text-[76px] font-bold text-white leading-none tracking-tight mb-5 whitespace-nowrap animate-fade-up">
    {heroTitle}
  </h1>
  <p className="text-xl md:text-2xl font-semibold text-gold leading-snug animate-fade-up delay-150">
    {heroSubtitle}
  </p>
  <div className="mt-auto pt-10 animate-fade-up delay-400" aria-hidden="true">
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-20 h-20 lg:w-28 lg:h-28 text-gold opacity-80"
    >
      {/* Fixed: center post */}
      <line x1="60" y1="28" x2="60" y2="85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Fixed: base */}
      <line x1="42" y1="85" x2="78" y2="85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Fixed: fulcrum dot */}
      <circle cx="60" cy="28" r="3.5" fill="currentColor" />
      {/* Animated: beam + chains + pans — rotates around fulcrum (center top of bounding box) */}
      <g className="animate-scale-sway">
        {/* Beam */}
        <line x1="18" y1="28" x2="102" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Left chain */}
        <line x1="18" y1="28" x2="18" y2="57" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left pan */}
        <path d="M 6 57 Q 18 68 30 57" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* Right chain */}
        <line x1="102" y1="28" x2="102" y2="57" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right pan */}
        <path d="M 90 57 Q 102 68 114 57" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  </div>
</div>
```

- [ ] **Step 3: Run dev and visually verify the hero**

```bash
npm run dev
```

Open `http://localhost:3000` in the browser. Verify:
- Kartlis Deda statue is sharper and more vivid gold (no washed-out look)
- The statue wrapper gently floats up and down
- Hero title fades up on load
- Subtitle fades up with a slight delay after title
- Scales SVG appears at bottom of text column, gently swaying
- All animations disabled when OS has reduced-motion enabled (test in browser devtools > Rendering > Emulate prefers-reduced-motion)

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: enhance hero — vivid image, float, entrance anims, scales SVG"
```

---

## Task 4: Service Cards, Stats, Features — Scroll Animations & Hover

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `AnimateIn` from Task 2, `.card-hover` from Task 1

**What changes:**
1. Import `AnimateIn` at top of `page.tsx`
2. Service cards: replace existing hover classes with `card-hover`, wrap each card in `AnimateIn`
3. Stats cards: wrap each in `AnimateIn`
4. Feature cards: wrap each in `AnimateIn`

- [ ] **Step 1: Add the `AnimateIn` import to `src/app/page.tsx`**

Find the existing imports block (around line 1–16). Add this line after the last import:

```tsx
import { AnimateIn } from "@/components/site/AnimateIn"
```

- [ ] **Step 2: Update the service card `Link` — replace hover classes with `card-hover`**

Find the active service card `Link` element (around line 188–204):

```tsx
<Link
  key={card._id}
  href={card.href}
  className="border-t-[3px] border-t-primary bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 transition-all group"
>
```

Replace with:

```tsx
<Link
  key={card._id}
  href={card.href}
  className="border-t-[3px] border-t-primary bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 card-hover group"
>
```

- [ ] **Step 3: Wrap each service card in `AnimateIn` with stagger**

The service cards section maps over `allServiceCards`. The full map block currently returns either an invisible placeholder `<div>` or an active `<Link>`. Wrap both return values in `AnimateIn`.

Find the grid container and map (around line 157–207):

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
  {allServiceCards.map((card) => {
    if (!visibleHrefs.has(card.href)) {
      return <div key={card._id} className="invisible" aria-hidden="true" />
    }
    // ... card icon, title, etc
    if (card.comingSoon) {
      return (
        <div key={card._id} className="border-t-[3px] border-t-border bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 opacity-55 cursor-default">
          ...
        </div>
      )
    }
    return (
      <Link key={card._id} href={card.href} className="...">
        ...
      </Link>
    )
  })}
</div>
```

Replace with (the inner card JSX stays identical — only the wrapping changes):

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
  {allServiceCards.map((card, idx) => {
    if (!visibleHrefs.has(card.href)) {
      return <div key={card._id} className="invisible" aria-hidden="true" />
    }
    const CardIcon = resolveIcon(card.icon)
    const seedCard = seedCardById.get(card._id)
    const cardTitle    = pick(card.title,    card.titleEn    || seedCard?.titleEn,    locale)
    const cardSubtitle = pick(card.subtitle, card.subtitleEn || seedCard?.subtitleEn, locale)
    const cardCta      = pick(card.ctaText || seedCard?.ctaText || "", card.ctaTextEn || seedCard?.ctaTextEn, locale) || d.home.learnMore

    if (card.comingSoon) {
      return (
        <AnimateIn key={card._id} delay={idx * 80}>
          <div className="border-t-[3px] border-t-border bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 opacity-55 cursor-default h-full">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <CardIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground text-base leading-snug">{cardTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">{cardSubtitle}</p>
            </div>
            <div className="mt-auto text-xs tracking-widest uppercase text-muted-foreground font-semibold">
              {d.home.comingSoon}
            </div>
          </div>
        </AnimateIn>
      )
    }
    return (
      <AnimateIn key={card._id} delay={idx * 80}>
        <Link
          href={card.href}
          className="border-t-[3px] border-t-primary bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 card-hover group h-full"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CardIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-base leading-snug">{cardTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">{cardSubtitle}</p>
          </div>
          <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
            {cardCta} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </AnimateIn>
    )
  })}
</div>
```

Note: `h-full` added to inner card elements so they fill the `AnimateIn` wrapper div height.

- [ ] **Step 4: Wrap each stat card in `AnimateIn`**

Find the stats grid map (around line 217–233):

```tsx
<div className={`grid ${statsGrid(stats.length)} gap-6`}>
  {stats.map((s) => {
    ...
    return (
      <div key={s._id} className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-3">
        ...
      </div>
    )
  })}
</div>
```

Replace the return value inside the map:

```tsx
<div className={`grid ${statsGrid(stats.length)} gap-6`}>
  {stats.map((s, idx) => {
    const metric = resolveMetric(s.metric, s.label)
    const display = metric ? publicStats[metric].toLocaleString("ka-GE") : s.value
    const seedStat = seedStatById.get(s._id)
    const statLabel = pick(s.label, s.labelEn || seedStat?.labelEn, locale)
    return (
      <AnimateIn key={s._id} delay={idx * 100}>
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-3 card-hover h-full">
          <p className="text-6xl font-bold text-primary leading-none tabular-nums">{display}</p>
          <div className="w-8 h-px bg-border" />
          <p className="text-sm text-muted-foreground leading-snug max-w-[140px]">{statLabel}</p>
        </div>
      </AnimateIn>
    )
  })}
</div>
```

- [ ] **Step 5: Wrap each feature card in `AnimateIn`**

Find the features grid map (around line 242–261):

```tsx
<div className={`grid ${featuresGrid(features.length)} gap-6`}>
  {features.map((f) => {
    ...
    return (
      <div key={f._id} className="bg-muted/40 rounded-2xl p-5 flex flex-col gap-3">
        ...
      </div>
    )
  })}
</div>
```

Replace the return value inside the map:

```tsx
<div className={`grid ${featuresGrid(features.length)} gap-6`}>
  {features.map((f, idx) => {
    const FIcon = resolveIcon(f.icon)
    const seedFeature = seedFeatureById.get(f._id)
    const featureTitle = pick(f.title, f.titleEn || seedFeature?.titleEn, locale)
    const featureBody  = pick(f.body,  f.bodyEn  || seedFeature?.bodyEn,  locale)
    return (
      <AnimateIn key={f._id} delay={idx * 60}>
        <div className="bg-muted/40 rounded-2xl p-5 flex flex-col gap-3 card-hover h-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FIcon className="h-4 w-4 text-primary" />
            </div>
            <p className="font-bold text-foreground text-sm leading-snug">{featureTitle}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{featureBody}</p>
        </div>
      </AnimateIn>
    )
  })}
</div>
```

- [ ] **Step 6: Add `btn-hover` to the CTA button**

Find the CTA section button (around line 286–291):

```tsx
<Link
  href={ctaButtonHref}
  className="mt-8 inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
>
```

Replace with:

```tsx
<Link
  href={ctaButtonHref}
  className="mt-8 inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 btn-hover"
>
```

- [ ] **Step 7: Verify visually**

```bash
npm run dev
```

Open `http://localhost:3000` and scroll down. Verify:
- Service cards fade up as they enter the viewport, each with a slight stagger
- Cards lift slightly on hover with a gold-tinted shadow
- Stats and feature cards also animate in on scroll with stagger
- CTA button subtly scales on hover

- [ ] **Step 8: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: scroll animations and hover micro-interactions on homepage sections"
```

---

## Task 5: PricingSection — Scroll Animations + Shimmer Badge

**Files:**
- Modify: `src/components/site/PricingSection.tsx`

**Interfaces:**
- Consumes: `AnimateIn` from Task 2, `.card-hover` from Task 1

**What changes:**
1. Import `AnimateIn`
2. Wrap each pricing card in `AnimateIn` with stagger
3. Replace `border-primary` highlighted card border with full ring + shadow
4. Add shimmer gradient to the "popular" badge on highlighted plans

- [ ] **Step 1: Add the `AnimateIn` import**

In `src/components/site/PricingSection.tsx`, find the imports section (lines 1–9) and add:

```tsx
import { AnimateIn } from "@/components/site/AnimateIn"
```

- [ ] **Step 2: Replace the entire card render block with animated version**

Find the `plans.map(...)` block inside the `return` (around lines 109–175). Replace it entirely:

```tsx
<div className={`grid gap-6 ${gridCols(plans.length)} items-start`}>
  {plans.map((p, idx) => (
    <AnimateIn key={p.id} delay={idx * 100}>
      <div
        className={[
          "relative rounded-2xl border bg-card flex flex-col p-7 card-hover h-full",
          p.highlighted
            ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
            : "border-border",
        ].join(" ")}
      >
        {p.badge && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span
              className="text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.366 0.165 264) 0%, oklch(0.48 0.19 255) 50%, oklch(0.366 0.165 264) 100%)",
                backgroundSize: "200% auto",
                animation: "shimmer 3s linear infinite",
              }}
            >
              {p.badge}
            </span>
          </div>
        )}

        <p className="font-bold text-base mb-4 text-primary">{p.name}</p>

        <div className="flex items-end gap-1 mb-6">
          <span className="text-5xl font-bold text-foreground leading-none">{p.price}</span>
          <span className="text-lg font-semibold text-foreground mb-0.5">₾</span>
          <span className="text-sm text-muted-foreground mb-1">{strings.perMonth}</span>
        </div>

        <ul className="space-y-3 text-sm flex-1 mb-8">
          {p.items.map((item, ii) => (
            <li key={ii} className="flex gap-2.5 items-start">
              <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span className="text-foreground/80 leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        {p.planKey ? (
          <UpgradeButton
            plan={p.planKey}
            label={p.ctaText}
            className={[
              "w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 btn-hover",
              p.highlighted
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "border border-border text-primary hover:bg-primary/5",
            ].join(" ")}
          />
        ) : (
          <Link
            href={p.ctaHref}
            className={[
              "w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors btn-hover",
              p.highlighted
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "border border-border text-primary hover:bg-primary/5",
            ].join(" ")}
          >
            {p.ctaText}
          </Link>
        )}
      </div>
    </AnimateIn>
  ))}
</div>
```

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Scroll to the pricing section. Verify:
- Pricing cards animate in with stagger as they enter view
- Highlighted plan badge has a shimmer light sweeping across it
- All cards have hover lift effect

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/PricingSection.tsx
git commit -m "feat: pricing cards scroll animation and shimmer badge"
```

---

## Task 6: Footer — Link Underline Hover

**Files:**
- Modify: `src/components/site/footer.tsx`

**What changes:** Add `footer-link` class to nav and legal link `<a>` elements.

- [ ] **Step 1: Update nav links in `src/components/site/footer.tsx`**

Find the nav link (around line 62–65):

```tsx
<Link
  href={n.href}
  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
>
```

Replace with:

```tsx
<Link
  href={n.href}
  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 footer-link"
>
```

- [ ] **Step 2: Update legal links**

Find the legal link (around line 79–82):

```tsx
<Link
  href={l.href}
  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
>
```

Replace with:

```tsx
<Link
  href={l.href}
  className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 footer-link"
>
```

- [ ] **Step 3: Update contact email and site links**

Find the email `<a>` (around line 98–100):

```tsx
<a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors truncate">
```

Replace with:

```tsx
<a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors truncate footer-link">
```

Find the website `<a>` (around line 105–107):

```tsx
<a href="https://chemiuristi.ge" className="hover:text-white transition-colors">
```

Replace with:

```tsx
<a href="https://chemiuristi.ge" className="hover:text-white transition-colors footer-link">
```

Find the phone `<a>` (around line 110–113):

```tsx
<a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
```

Replace with:

```tsx
<a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:text-white transition-colors footer-link">
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Scroll to the footer. Hover over navigation links — a white underline should slide in from the left.

- [ ] **Step 5: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/site/footer.tsx
git commit -m "feat: footer link underline slide-in hover animation"
```

---

## Task 7: Final Check & Dev Run

**Goal:** Confirm all features work together end-to-end before declaring done.

- [ ] **Step 1: Run dev**

```bash
npm run dev
```

- [ ] **Step 2: Full visual walkthrough checklist**

Open `http://localhost:3000` and verify each item:

**Hero:**
- [ ] Kartlis Deda statue is vivid gold, sharper, nearly full opacity
- [ ] Drop-shadow glow visible around the statue
- [ ] Statue slowly floats up and down
- [ ] Hero title fades/slides up on load
- [ ] Subtitle fades up with visible delay after title
- [ ] Scales SVG visible at bottom of text column, swaying gently

**Service cards:**
- [ ] Cards animate in (fade + slide up) as page loads / scrolls
- [ ] Cards lift and get a gold shadow tint on hover
- [ ] Arrow icon slides right on card hover

**Stats section:**
- [ ] Stat cards fade up as they enter the viewport

**Features section:**
- [ ] Feature cards fade in with stagger

**Pricing:**
- [ ] Pricing cards slide up on scroll
- [ ] Popular badge has a shimmering light effect
- [ ] Buttons subtly scale on hover

**Footer:**
- [ ] White underline slides in from left on link hover

**Typography:**
- [ ] Section headings (h2) use serif font (more elegant, slightly different letter form than body text)

**Reduced motion:**
- [ ] In Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → reduced: all animations stop. Content is still visible.

- [ ] **Step 3: Final lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: builds successfully with no errors. Warnings about dynamic routes are acceptable.
