import { User } from "@/lib/models/user";

export type QuotaService = "consultations" | "docGeneration" | "docReview" | "docTemplates";

export type QuotaUser = {
  consultationsRemaining?: number | null;
  docGenerationRemaining?: number | null;
  docReviewRemaining?: number | null;
  docTemplatesRemaining?: number | null;
  customConsultationsRemaining?: number | null;
  customDocGenerationRemaining?: number | null;
  customDocReviewRemaining?: number | null;
  customDocTemplatesRemaining?: number | null;
  customPlanExpiresAt?: Date | string | null;
};

function primaryRemaining(user: QuotaUser, service: QuotaService): number {
  switch (service) {
    case "consultations":
      return user.consultationsRemaining ?? 0;
    case "docGeneration":
      return user.docGenerationRemaining ?? 0;
    case "docReview":
      return user.docReviewRemaining ?? 0;
    case "docTemplates":
      return user.docTemplatesRemaining ?? 0;
  }
}

function customActive(user: QuotaUser): boolean {
  return !!user.customPlanExpiresAt && new Date(user.customPlanExpiresAt) > new Date();
}

function customRemaining(user: QuotaUser, service: QuotaService): number {
  if (!customActive(user)) return 0;
  switch (service) {
    case "consultations":
      return user.customConsultationsRemaining ?? 0;
    case "docGeneration":
      return user.customDocGenerationRemaining ?? 0;
    case "docReview":
      return user.customDocReviewRemaining ?? 0;
    case "docTemplates":
      return user.customDocTemplatesRemaining ?? 0;
  }
}

/** Sum of both pools — used for user-facing "you have N remaining" messages. */
export function totalRemaining(user: QuotaUser, service: QuotaService): number {
  return primaryRemaining(user, service) + customRemaining(user, service);
}

export type QuotaSplit = { fromPrimary: number; fromCustom: number };

/**
 * How much of `amount` to draw from the primary (subscription/free) pool vs.
 * the custom (one-time top-up) pool, or null if neither pool combined has
 * enough. Primary is drawn first — a custom package is bought specifically
 * to keep working *after* the subscription/free limit runs out, so it's
 * spent last as overflow capacity.
 */
export function splitQuota(
  user: QuotaUser,
  service: QuotaService,
  amount: number
): QuotaSplit | null {
  const primary = primaryRemaining(user, service);
  const custom = customRemaining(user, service);
  if (primary + custom < amount) return null;
  const fromPrimary = Math.min(primary, amount);
  return { fromPrimary, fromCustom: amount - fromPrimary };
}

const PRIMARY_FIELD_NAME: Record<QuotaService, string> = {
  consultations: "consultationsRemaining",
  docGeneration: "docGenerationRemaining",
  docReview: "docReviewRemaining",
  docTemplates: "docTemplatesRemaining",
};
const CUSTOM_FIELD_NAME: Record<QuotaService, string> = {
  consultations: "customConsultationsRemaining",
  docGeneration: "customDocGenerationRemaining",
  docReview: "customDocReviewRemaining",
  docTemplates: "customDocTemplatesRemaining",
};

/** Decrement whichever pool(s) `split` says to draw from, in one DB call. */
export async function applyQuotaSplit(
  userId: string,
  service: QuotaService,
  split: QuotaSplit
): Promise<void> {
  const inc: Record<string, number> = {};
  if (split.fromPrimary > 0) inc[PRIMARY_FIELD_NAME[service]] = -split.fromPrimary;
  if (split.fromCustom > 0) inc[CUSTOM_FIELD_NAME[service]] = -split.fromCustom;
  if (Object.keys(inc).length === 0) return;
  await User.findByIdAndUpdate(userId, { $inc: inc });
}
