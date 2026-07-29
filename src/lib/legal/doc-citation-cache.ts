/**
 * Verified legal-basis citations for AI-generated documents, cached per exact
 * citations-section content (not per doc type — two documents of the same
 * type can rely on entirely different articles depending on the facts the
 * user provided, so a type-wide cache previously served one document's
 * verified articles as the "sources" for every other document of that type,
 * regardless of what its own body actually cited). Keying by a hash of the
 * model's own citationsSection means identical facts (same articles drafted)
 * still skip the live Perplexity fee, while different facts always get their
 * own verification.
 * Long TTL (30 days) mirrors fetch-source.ts's reasoning for law text: it
 * changes rarely, so a stale cache is a good tradeoff for the cost saved.
 *
 * Persisted in Mongo rather than in-memory: a globalThis Map only caught
 * repeats on the same warm Vercel Function instance, so every other cold
 * instance re-paid the live Perplexity fee for content it hadn't personally
 * verified yet — defeating the "once per unique content per 30 days" intent.
 * A failed/empty verification is never cached, so the next request just
 * tries the live call again instead of caching a miss.
 */
import { createHash } from "crypto";
import { dbConnect } from "../db";
import { DocCitationCacheModel } from "../models/doc-citation-cache";
import type { Locale } from "../i18n/config";

export type GeneratableDocType = "complaint" | "demand-letter";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Verified citations are language- and content-specific (the model verifies
// whatever language the citations section was produced in, and the result
// only applies to that exact set of articles), so the cache key must include
// both — otherwise an English request could be served a cached Georgian
// legal-basis block, or one document's articles could be served for another
// document's unrelated facts.
function cacheKey(type: GeneratableDocType, locale: Locale, citationsSection: string): string {
  const hash = createHash("sha256").update(citationsSection.trim()).digest("hex").slice(0, 32);
  return `${type}:${locale}:${hash}`;
}

export async function getCachedCitations(
  type: GeneratableDocType,
  locale: Locale,
  citationsSection: string
): Promise<string | null> {
  await dbConnect();
  const entry = await DocCitationCacheModel.findOne({
    docType: cacheKey(type, locale, citationsSection),
  }).lean();
  if (!entry || entry.expiresAt.getTime() <= Date.now()) return null;
  return entry.legalBasis;
}

export async function setCachedCitations(
  type: GeneratableDocType,
  legalBasis: string,
  locale: Locale,
  citationsSection: string
): Promise<void> {
  await dbConnect();
  const docType = cacheKey(type, locale, citationsSection);
  await DocCitationCacheModel.findOneAndUpdate(
    { docType },
    { docType, legalBasis, expiresAt: new Date(Date.now() + TTL_MS) },
    { upsert: true }
  );
}
