import { Schema, model, models, type Model } from "mongoose"

const HomePageSchema = new Schema(
  {
    hero: {
      title: { type: String, default: "" },
      subtitle: { type: String, default: "" },
      ctaText: { type: String, default: "" },
      ctaHref: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
      imagePubId: { type: String, default: "" },
    },
    stats: [{ label: String, value: String }],
    features: [{ title: String, body: String, icon: String, order: { type: Number, default: 0 } }],
    services: [{ title: String, description: String, href: String, icon: String, order: { type: Number, default: 0 } }],
    ctaSection: {
      title: { type: String, default: "" },
      subtitle: { type: String, default: "" },
      buttonText: { type: String, default: "" },
      buttonHref: { type: String, default: "" },
    },
    status: { type: String, enum: ["draft", "published", "hidden"], default: "draft" },
  },
  { timestamps: true }
)

export type HomePageDoc = { hero: Record<string, string>; stats: unknown[]; features: unknown[]; services: unknown[]; ctaSection: Record<string, string>; status: string; _id: unknown }

export const HomePage: Model<HomePageDoc> =
  (models.HomePage as Model<HomePageDoc>) || model<HomePageDoc>("HomePage", HomePageSchema)
