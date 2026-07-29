import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Persisted counterpart to the old per-instance in-memory doc-citation cache
 * (see lib/legal/doc-citation-cache.ts). `docType` here is actually a
 * composite key (doc type + locale + hash of the exact citations content) —
 * one row per distinct set of articles ever verified, not one row per doc
 * type — so different documents' facts never share a cached "legal basis".
 */
const DocCitationCacheSchema = new Schema(
  {
    docType: { type: String, required: true, unique: true },
    legalBasis: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export type DocCitationCacheDoc = InferSchemaType<typeof DocCitationCacheSchema>;

export const DocCitationCacheModel: Model<DocCitationCacheDoc> =
  (models.DocCitationCache as Model<DocCitationCacheDoc>) ||
  model<DocCitationCacheDoc>("DocCitationCache", DocCitationCacheSchema);
