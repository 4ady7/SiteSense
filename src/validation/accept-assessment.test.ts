import { describe, expect, it } from "vitest";
import { calculateRiskScore } from "@/domain/risk";
import { acceptModelAssessment } from "@/validation/accept-assessment";
import { sampleModelInput, sampleProvenanceContext } from "@/validation/sample-assessment";

describe("acceptModelAssessment", () => {
  it("calculates risk and forces human review without trusting model-only fields", () => {
    const result = acceptModelAssessment(sampleModelInput(), sampleProvenanceContext());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const finding = result.draft.findings[0];
    expect(finding).toBeDefined();
    if (!finding) {
      return;
    }
    expect(finding.riskScore).toBe(calculateRiskScore("medium", "possible"));
    expect(finding.riskBand).toBe("medium");
    expect(finding.reviewStatus).toBe("pending");
    expect(result.draft.humanReviewRequired).toBe(true);
    expect(result.draft.findings).toHaveLength(1);
  });

  it("marks unclassified findings as needing more evidence", () => {
    const input = sampleModelInput();
    const finding = input.findings[0];
    if (!finding) {
      throw new Error("sample finding missing");
    }
    finding.category = "unclassified";
    const result = acceptModelAssessment(input, sampleProvenanceContext());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.findings[0]?.reviewStatus).toBe("needs_more_evidence");
    }
  });

  it("does not produce a draft when any citation or evidence reference is fabricated", () => {
    const input = sampleModelInput();
    const finding = input.findings[0];
    if (!finding) {
      throw new Error("sample finding missing");
    }
    const evidence = finding.evidence[0];
    const citation = finding.citations[0];
    if (!evidence || !citation) {
      throw new Error("sample evidence missing");
    }
    input.findings.push({
      ...finding,
      title: "Second finding",
      evidence: [{ ...evidence, frameId: "frame_fabricated", timestampSeconds: 1 }],
      citations: [{ ...citation, chunkId: "chunk_fabricated" }],
    });

    const snapshot = structuredClone(input);
    const result = acceptModelAssessment(input, sampleProvenanceContext());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toEqual(["unknown_frame", "unknown_citation"]);
    }
    expect(input).toEqual(snapshot);
  });

  it("does not repair or persist malformed model output", () => {
    const input = sampleModelInput();
    const snapshot = structuredClone(input);
    const result = acceptModelAssessment(
      { ...input, findings: [{ ...input.findings[0], confidence: 2 }] },
      sampleProvenanceContext(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect("draft" in result).toBe(false);
    }
    expect(input).toEqual(snapshot);
  });
});
