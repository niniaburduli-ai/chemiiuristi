import { Schema, model, models, type Model } from "mongoose"

const LegalNoticeSchema = new Schema(
  {
    type: { type: String, enum: ["ai-warning", "terms", "privacy", "cookie"], required: true, index: true },
    title: { type: String, default: "" },
    body: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["draft", "published", "hidden"], default: "draft" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
)

export type LegalNoticeDoc = { type: string; title: string; body: object; status: string; publishedAt?: Date; _id: unknown; createdAt: Date }

export const LegalNotice: Model<LegalNoticeDoc> =
  (models.LegalNotice as Model<LegalNoticeDoc>) || model<LegalNoticeDoc>("LegalNotice", LegalNoticeSchema)
