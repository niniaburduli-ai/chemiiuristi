import { dbConnect } from "@/lib/db"
import { CustomPlanRates, type CustomPlanRatesDoc } from "@/lib/models/CustomPlanRates"
import { DEFAULT_CUSTOM_RATES, type CustomPlanRatesData } from "@/lib/custom-plan-rates-config"

export {
  STEP_QUANTITIES,
  CUSTOM_SERVICES,
  DEFAULT_CUSTOM_RATES,
  priceForQuantity,
  computeCustomTotal,
} from "@/lib/custom-plan-rates-config"
export type {
  CustomService,
  CustomPlanRatesData,
  CustomSelection,
} from "@/lib/custom-plan-rates-config"

const isValid5 = (v: unknown): v is number[] => Array.isArray(v) && v.length === 5

/** Read the singleton rate table, falling back to defaults on any DB failure. */
export async function getCustomPlanRates(): Promise<CustomPlanRatesData> {
  try {
    await dbConnect()
    const doc = await CustomPlanRates.findOne().lean<CustomPlanRatesDoc>()
    if (!doc) return { ...DEFAULT_CUSTOM_RATES }
    return {
      consultations: isValid5(doc.consultations) ? doc.consultations : DEFAULT_CUSTOM_RATES.consultations,
      docTemplates: isValid5(doc.docTemplates) ? doc.docTemplates : DEFAULT_CUSTOM_RATES.docTemplates,
      docGeneration: isValid5(doc.docGeneration) ? doc.docGeneration : DEFAULT_CUSTOM_RATES.docGeneration,
      docReview: isValid5(doc.docReview) ? doc.docReview : DEFAULT_CUSTOM_RATES.docReview,
    }
  } catch (err) {
    console.error("[custom-plan-rates] getCustomPlanRates DB read failed, serving defaults:", err)
    return { ...DEFAULT_CUSTOM_RATES }
  }
}
