import { describe, expect, it } from "vitest";
import {
  HAZARD_CATEGORIES,
  initialReviewStatus,
  isFindingCategory,
  isHazardCategory,
  UNCLASSIFIED_CATEGORY,
} from "@/domain/taxonomy";

describe("hazard taxonomy", () => {
  it("accepts only the controlled categories", () => {
    for (const category of HAZARD_CATEGORIES) {
      expect(isHazardCategory(category)).toBe(true);
      expect(isFindingCategory(category)).toBe(true);
    }
  });

  it("rejects categories the model might invent", () => {
    expect(isHazardCategory("trip_hazard")).toBe(false);
    expect(isFindingCategory("falls_from_height")).toBe(false);
    expect(isFindingCategory("slips and trips")).toBe(false);
  });

  it("treats unclassified as a review state, not a hazard category", () => {
    expect(isHazardCategory(UNCLASSIFIED_CATEGORY)).toBe(false);
    expect(isFindingCategory(UNCLASSIFIED_CATEGORY)).toBe(true);
    expect(initialReviewStatus(UNCLASSIFIED_CATEGORY)).toBe("needs_more_evidence");
  });

  it("leaves classified findings pending human review", () => {
    expect(initialReviewStatus("slips_trips")).toBe("pending");
  });
});
