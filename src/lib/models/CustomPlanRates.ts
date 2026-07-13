import { Schema, model, models, type Model } from "mongoose"
import { DEFAULT_CUSTOM_RATES } from "@/lib/custom-plan-rates-config"

/** Singleton admin-editable price table for the custom "build your own" plan. */
const CustomPlanRatesSchema = new Schema(
  {
    consultations: { type: [Number], default: DEFAULT_CUSTOM_RATES.consultations },
    docTemplates: { type: [Number], default: DEFAULT_CUSTOM_RATES.docTemplates },
    docGeneration: { type: [Number], default: DEFAULT_CUSTOM_RATES.docGeneration },
    docReview: { type: [Number], default: DEFAULT_CUSTOM_RATES.docReview },
  },
  { timestamps: true, minimize: false }
)

export type CustomPlanRatesDoc = {
  _id: unknown
  consultations: number[]
  docTemplates: number[]
  docGeneration: number[]
  docReview: number[]
  createdAt: Date
  updatedAt: Date
}

export const CustomPlanRates: Model<CustomPlanRatesDoc> =
  (models.CustomPlanRates as Model<CustomPlanRatesDoc>) ||
  model<CustomPlanRatesDoc>("CustomPlanRates", CustomPlanRatesSchema)
