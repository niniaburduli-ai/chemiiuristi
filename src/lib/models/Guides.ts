import { Schema, model, models, type Model } from "mongoose"

const guideSectionSchema = new Schema(
  {
    title: { type: String, default: "" },
    titleEn: { type: String, default: "" },
    paragraphs: { type: [String], default: [] },
    paragraphsEn: { type: [String], default: [] },
    list: { type: [String], default: [] },
    listEn: { type: [String], default: [] },
  },
  { _id: false }
)

const guideSourceSchema = new Schema(
  {
    label: { type: String, default: "" },
    labelEn: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false }
)

const guideItemSchema = new Schema(
  {
    _id: { type: String, required: true },
    slug: { type: String, required: true },
    title: { type: String, default: "" },
    titleEn: { type: String, default: "" },
    description: { type: String, default: "" },
    descriptionEn: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    keywordsEn: { type: [String], default: [] },
    intro: { type: String, default: "" },
    introEn: { type: String, default: "" },
    sections: { type: [guideSectionSchema], default: [] },
    sources: { type: [guideSourceSchema], default: [] },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published", "hidden"], default: "draft" },
  },
  { _id: false }
)

const GuidesSchema = new Schema(
  { items: { type: [guideItemSchema], default: [] } },
  { timestamps: true }
)

export type GuidesDoc = {
  items: Array<{
    _id: string
    slug: string
    title: string
    titleEn: string
    description: string
    descriptionEn: string
    keywords: string[]
    keywordsEn: string[]
    intro: string
    introEn: string
    sections: Array<{ title: string; titleEn: string; paragraphs: string[]; paragraphsEn: string[]; list: string[]; listEn: string[] }>
    sources: Array<{ label: string; labelEn: string; url: string }>
    order: number
    status: string
  }>
}

export const Guides: Model<GuidesDoc> =
  (models.Guides as Model<GuidesDoc>) || model<GuidesDoc>("Guides", GuidesSchema)
