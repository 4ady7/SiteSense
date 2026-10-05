import type { Likelihood, Severity } from "@/domain/taxonomy";

/**
 * Application-owned triage weights.
 * This matrix is not an HSE standard and it is not a probability of harm.
 * The model may propose severity and likelihood. Only this module produces a score.
 */
export const SEVERITY_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
} as const satisfies Record<Severity, number>;

export const LIKELIHOOD_WEIGHT = {
  unlikely: 1,
  possible: 2,
  likely: 3,
  almost_certain: 4,
} as const satisfies Record<Likelihood, number>;

export const RISK_BANDS = ["low", "medium", "high", "critical"] as const;
export type RiskBand = (typeof RISK_BANDS)[number];

export function calculateRiskScore(severity: Severity, likelihood: Likelihood): number {
  return SEVERITY_WEIGHT[severity] * LIKELIHOOD_WEIGHT[likelihood];
}

/**
 * Bands for scores produced by {@link calculateRiskScore}:
 * 1–3 low, 4–7 medium, 8–11 high, 12–16 critical.
 */
export function riskBandForScore(score: number): RiskBand {
  if (!Number.isInteger(score) || score < 1 || score > 16) {
    throw new RangeError(`Risk score ${score} is outside the application matrix (1–16).`);
  }
  if (score <= 3) {
    return "low";
  }
  if (score <= 7) {
    return "medium";
  }
  if (score <= 11) {
    return "high";
  }
  return "critical";
}
