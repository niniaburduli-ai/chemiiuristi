import { Schema, model, models, type Model } from "mongoose"

const AboutPageSchema = new Schema(
  {
    title: { type: String, default: "" },
    intro: { type: String, default: "" },
    body: { type: Schema.Types.Mixed, default: {} },
    historyTitle: { type: String, default: "" },
    historyBody: { type: String, default: "" },
    missionTitle: { type: String, default: "" },
    mission: { type: String, default: "" },
    team: [
      {
        name: { type: String, default: "" },
        role: { type: String, default: "" },
        imageUrl: { type: String, default: "" },
        imagePubId: { type: String, default: "" },
        order: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ["draft", "published", "hidden"], default: "draft" },
    locale: { type: String, default: "ka", index: true },
  },
  { timestamps: true }
)

export type AboutPageDoc = { title: string; intro: string; body: object; historyTitle: string; historyBody: string; missionTitle: string; mission: string; team: unknown[]; status: string; locale: string; _id: unknown }

export const AboutPage: Model<AboutPageDoc> =
  (models.AboutPage as Model<AboutPageDoc>) || model<AboutPageDoc>("AboutPage", AboutPageSchema)
