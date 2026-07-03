# Document Analysis Modal — Design

Date: 2026-07-03

## Goal

Add a working "Document Analysis" feature, reachable from the homepage's third
service card ("დოკუმენტები" / Documents), that opens a modal (no navigation),
lets the user upload a document (PDF/DOCX/TXT/MD), runs AI risk analysis, and
renders structured results (categorized risks, severity, explanations,
recommendations) inside the modal.

**Hard constraint:** the Consultation feature (`/chat`, `/api/chat`,
`chat-client.tsx`, `openrouter.ts`) is not touched. No other page's layout or
design changes.

## Context (from codebase investigation)

- There is no existing "modal" pattern anywhere in the app and no code named
  "LegalGuard". The closest existing thing to "document analysis" is the
  `/review` feature: `src/app/review/review-client.tsx`,
  `src/app/api/review/route.ts`, `src/lib/models/document-review.ts`. It
  already does AI-based document analysis but:
  - only decodes raw UTF-8 bytes (no real PDF/DOCX parsing — garbage output
    for real PDF/DOCX files)
  - returns unstructured `findings: string[]` / `recommendations: string[]`,
    no category or severity
  - is a full page behind auth + `flags.review`, not a modal
- Homepage service cards are seeded in `src/lib/homepage-defaults.ts`
  (`serviceCards[2]`, id `sc-3`, currently `href: "/docs"`,
  `comingSoon: true`) and rendered in `src/app/page.tsx:159-216`
  (`Home` is an `async` server component — cards render as `<Link>` when
  `comingSoon` is false, or an inert `<div>` when true).
- `isPathEnabled(href, flags)` (`src/lib/features-config.ts`) only gates hrefs
  that map to a `FeatureKey`; `/review` maps to the `review` flag (default
  `true`), `/docs` currently maps to nothing (always enabled).
- Quota: `User.docReviewRemaining` (default 1) already gates `/api/review`,
  independent of `consultationsRemaining` used by chat.
- shadcn `Dialog` and `Badge` are already installed and unused by any current
  flow — this feature is their first use.

## Decisions (confirmed with user)

1. Extend `/review`'s existing model + API (rename/restructure in place)
   rather than build a parallel feature. Reuses `DocumentReview` model,
   `/api/review` route, `docReviewRemaining` quota — least duplication.
2. New UI is a shadcn `Dialog` modal, not a page. Visual language matches the
   existing site (dark hero / `border-t-[3px] border-t-primary` card accents,
   gold/primary colors) since there's no literal "Consultation modal" to copy.
3. Severity taxonomy: 4 levels — `low` / `medium` / `high` / `critical`.
4. Risk categories: fixed taxonomy so the UI can use predictable
   icon/color-per-category — `liability`, `financial`, `termination`,
   `compliance`, `confidentiality`, `obligations`.

## Backend changes

### New dependencies

- `pdf-parse` — PDF text extraction.
- `mammoth` — DOCX text extraction (`extractRawText`).
- `.txt` / `.md` keep the existing UTF-8 decode path.

### `src/lib/models/document-review.ts`

Change `findings` from `[String]` to an array of subdocuments:

```ts
{
  category: { type: String, enum: [...], required: true },
  severity: { type: String, enum: ["low","medium","high","critical"], required: true },
  title: { type: String, required: true },
  explanation: { type: String, required: true },
  recommendation: { type: String, required: true },
}
```

Keep top-level `recommendations: [String]` for general, non-risk-specific
advice. Existing rows in the DB keep their old `string[]` shape (Mongo has no
migration step) — see dashboard compatibility note below.

### `src/app/api/review/route.ts`

- Extract text by file extension: `.pdf` → `pdf-parse`, `.docx` → `mammoth`,
  else → current UTF-8 decode. Reject unsupported extensions/mime types and
  oversized files (10MB cap) before parsing.
- Replace the pipe-delimited `SUMMARY:/FINDINGS:/RECOMMENDATIONS:` prompt and
  `parseReviewResponse` regex with a prompt that demands strict JSON:
  `{ summary, findings: [{category, severity, title, explanation, recommendation}], recommendations: [string] }`.
- Parse with `JSON.parse`, falling back to stripping ```` ```json ```` fences
  if present. If parsing still fails, return `502` without consuming quota
  (matches current behavior of only decrementing quota after a successful,
  saved analysis).
- Coerce unknown `category`/`severity` values from the model to the closest
  valid enum (default `compliance` / `medium`) rather than rejecting the
  whole response.
- Auth (401) and quota (403) behavior unchanged.

### `src/app/dashboard/reviews/page.tsx`

Must render both shapes without crashing: old rows where a finding is a
`string`, and new rows where a finding is the structured object. Guard with a
`typeof finding === "string"` check per item.

## Frontend changes

### `src/components/site/document-analysis-modal.tsx` (new, client component)

- shadcn `Dialog`, controlled `open`/`onOpenChange` from the parent.
- States: `idle` (dropzone-style upload area, click-to-browse,
  `accept=".pdf,.docx,.txt,.md"`) → `ready` (file chosen, "Analyze" button
  enabled) → `analyzing` (spinner, inputs disabled) → `results` (structured
  output) → `error`.
- Results layout: summary paragraph, then risk findings as
  `border-t-[3px]` accent cards color-coded by severity (green/yellow/orange/red),
  category + severity shown via `Badge`, explanation + recommendation text;
  general `recommendations` as a checklist below.
- Error states are inline, not thrown: unsupported/oversized file (client-side
  check before upload), `401` → "log in" link, `403` → `/pricing` link, other
  failures → retry button.
- Uses `getDict(locale)` for copy, consistent with the rest of the site's
  i18n convention (no hardcoded UI strings).

### Homepage wiring

- `src/lib/homepage-defaults.ts`: `serviceCards[2]` (`sc-3`) — flip
  `comingSoon: false`, change `href` from `/docs` to `/review` (so
  `isPathEnabled` correctly gates it on the existing `review` flag instead of
  always being enabled).
- `src/app/page.tsx`: extract the service-cards `<div className="grid ...">`
  block (lines ~165-213) into a new small client component,
  `src/components/site/service-cards.tsx`, taking the same data as props
  (`allServiceCards`, `visibleHrefs`, `seedCardById`, `d`, `locale`, icon
  resolver). Inside it, special-case the card whose `href === "/review"`: render
  the exact same JSX/classes as today but as a `<button>` that opens the
  modal, instead of a `<Link>`. The other two cards (`/chat`, `/templates`)
  keep rendering exactly as before — zero visual or behavioral change for
  them. This is the only change to `page.tsx`/`page.tsx`'s visual output.

## Non-goals / explicitly out of scope

- No changes to `/chat`, `chat-client.tsx`, `openrouter.ts`, or consultation
  quota logic.
- No changes to `/review` page's own UI (it keeps working standalone) beyond
  the shared model/route/prompt changes above, which are backward-compatible
  additions.
- No drag-and-drop file upload (click-to-browse only) — not requested, keeps
  scope tight.
- No new feature flag specifically for the modal; reuses the existing
  `review` flag via the href-based mapping above.

## Verification plan

- Manual, via `npm run dev`:
  - Upload a real sample `.txt`, `.pdf`, and `.docx` fixture through the
    modal; confirm extracted text is sane (not binary garbage) and results
    render with correct category/severity badges and colors.
  - No file selected → Analyze stays disabled.
  - Oversized / wrong-extension file → inline client error, no request sent.
  - Simulate `401` (logged out) and `403` (`docReviewRemaining = 0`) → correct
    inline prompts (login link / pricing link).
  - Force an AI/network failure → error state with retry, quota not
    decremented.
  - Confirm `/chat` and `/review` pages are visually and functionally
    unchanged before/after.
  - Confirm `/dashboard/reviews` renders old (string findings) and new
    (object findings) rows without crashing.
- `npm run lint` clean.
