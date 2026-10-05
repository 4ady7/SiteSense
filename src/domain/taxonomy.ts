export const HAZARD_CATEGORIES = [
  "slips_trips",
  "working_at_height",
  "vehicle_interface",
  "manual_handling",
  "electrical",
  "fire",
  "housekeeping",
  "ppe",
  "excavation",
  "access_egress",
] as const;

export type HazardCategory = (typeof HAZARD_CATEGORIES)[number];

/**
 * Controlled review state for a finding that does not fit the taxonomy.
 * This is not a hazard category the model may invent.
 */
export const UNCLASSIFIED_CATEGORY = "unclassified" as const;

export const FINDING_CATEGORIES = [UNCLASSIFIED_CATEGORY, ...HAZARD_CATEGORIES] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

const HAZARD_CATEGORY_SET: ReadonlySet<string> = new Set(HAZARD_CATEGORIES);

export function isHazardCategory(value: string): value is HazardCategory {
  return HAZARD_CATEGORY_SET.has(value);
}

export function isFindingCategory(value: string): value is FindingCategory {
  return (FINDING_CATEGORIES as readonly string[]).includes(value);
}

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const LIKELIHOODS = ["unlikely", "possible", "likely", "almost_certain"] as const;
export type Likelihood = (typeof LIKELIHOODS)[number];

export const REVIEW_STATUSES = [
  "pending",
  "needs_more_evidence",
  "accepted",
  "dismissed",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export function initialReviewStatus(category: FindingCategory): ReviewStatus {
  if (category === UNCLASSIFIED_CATEGORY) {
    return "needs_more_evidence";
  }
  return "pending";
}
