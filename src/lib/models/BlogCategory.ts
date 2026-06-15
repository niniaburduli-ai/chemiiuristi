import { Schema, model, models, type Model } from "mongoose"

const BlogCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published", "hidden"], default: "draft" },
  },
  { timestamps: true }
)

export type BlogCategoryDoc = { name: string; slug: string; description: string; status: string; _id: unknown }

export const BlogCategory: Model<BlogCategoryDoc> =
  (models.BlogCategory as Model<BlogCategoryDoc>) || model<BlogCategoryDoc>("BlogCategory", BlogCategorySchema)
