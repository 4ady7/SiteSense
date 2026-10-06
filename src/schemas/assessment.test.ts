import { describe, expect, it } from "vitest";
import { modelAssessmentSchema } from "@/schemas/assessment";
import { sampleModelInput } from "@/validation/sample-assessment";

describe("model assessment schema", () => {
  it("accepts a complete finding and an assessment with no findings", () => {
    expect(modelAssessmentSchema.safeParse(sampleModelInput()).success).toBe(true);
    expect(
      modelAssessmentSchema.safeParse({
        assessmentSummary: "No potential hazard was identified in the supplied frame.",
        findings: [],
      }).success,
    ).toBe(true);
  });

  it("rejects invented categories, severities, and non-numeric confidence", () => {
    const input = sampleModelInput();
    const finding = input.findings[0];
    if (!finding) {
      throw new Error("sample finding missing");
    }

    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, category: "trip_hazard" }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, severity: "extreme" }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, confidence: "0.86" }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, confidence: 1.01 }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, confidence: -0.01 }] }).success).toBe(false);
  });

  it("rejects missing likelihood and model-supplied risk scores", () => {
    const input = sampleModelInput();
    const finding = input.findings[0];
    if (!finding) {
      throw new Error("sample finding missing");
    }
    const { likelihood, ...withoutLikelihood } = finding;

    expect(likelihood).toBe("possible");
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [withoutLikelihood] }).success).toBe(false);
    expect(
      modelAssessmentSchema.safeParse({
        ...input,
        findings: [{ ...finding, riskScore: 12 }],
      }).success,
    ).toBe(false);
  });

  it("rejects findings without evidence and prose citations", () => {
    const input = sampleModelInput();
    const finding = input.findings[0];
    if (!finding) {
      throw new Error("sample finding missing");
    }

    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, evidence: [] }] }).success).toBe(false);
    expect(
      modelAssessmentSchema.safeParse({
        ...input,
        findings: [
          {
            ...finding,
            citations: [
              {
                chunkId: "According to HSE",
                relationship: "supports",
                reason: "Invented citation.",
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects blank text, impossible confidence, and oversized payloads", () => {
    const input = sampleModelInput();
    const finding = input.findings[0];
    const evidence = finding?.evidence[0];
    if (!finding || !evidence) {
      throw new Error("sample finding missing");
    }

    expect(modelAssessmentSchema.safeParse({ ...input, assessmentSummary: "   " }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, observation: "\n\t" }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, confidence: -1 }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, confidence: 999 }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, confidence: null }] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, findings: [{ ...finding, confidence: "high" }] }).success).toBe(false);
    expect(
      modelAssessmentSchema.safeParse({
        ...input,
        findings: [{ ...finding, evidence: [{ ...evidence, timestampSeconds: -1 }] }],
      }).success,
    ).toBe(false);
    expect(
      modelAssessmentSchema.safeParse({
        ...input,
        findings: [{ ...finding, evidence: [{ ...evidence, frameId: "../etc/passwd" }] }],
      }).success,
    ).toBe(false);
    expect(modelAssessmentSchema.safeParse({ findings: [] }).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ ...input, ignorePreviousInstructions: true }).success).toBe(false);
    expect(
      modelAssessmentSchema.safeParse({
        ...input,
        findings: Array.from({ length: 31 }, () => finding),
      }).success,
    ).toBe(false);
  });

  it("rejects malformed payloads", () => {
    expect(modelAssessmentSchema.safeParse("{").success).toBe(false);
    expect(modelAssessmentSchema.safeParse(null).success).toBe(false);
    expect(modelAssessmentSchema.safeParse([]).success).toBe(false);
    expect(modelAssessmentSchema.safeParse({ assessmentSummary: "x" }).success).toBe(false);
  });
});
