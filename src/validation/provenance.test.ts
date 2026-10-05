import { describe, expect, it } from "vitest";
import { modelAssessmentSchema } from "@/schemas/assessment";
import { SAMPLE_CHUNK_ID, SAMPLE_FRAME_ID, sampleModelInput, sampleProvenanceContext } from "@/validation/sample-assessment";
import { validateProvenance } from "@/validation/provenance";

function parsedSample() {
  const parsed = modelAssessmentSchema.parse(sampleModelInput());
  return parsed;
}

describe("provenance validation", () => {
  it("accepts evidence and citations that match supplied context", () => {
    expect(validateProvenance(parsedSample(), sampleProvenanceContext())).toEqual([]);
  });

  it("accepts a finding with no citations when nothing was retrieved", () => {
    const assessment = parsedSample();
    const finding = assessment.findings[0];
    if (!finding) {
      throw new Error("sample finding missing");
    }
    finding.citations = [];
    expect(
      validateProvenance(assessment, {
        ...sampleProvenanceContext(),
        retrievedChunkIds: [],
      }),
    ).toEqual([]);
  });

  it("rejects an unknown frame without changing the timestamp", () => {
    const assessment = parsedSample();
    const evidence = assessment.findings[0]?.evidence[0];
    if (!evidence) {
      throw new Error("sample evidence missing");
    }
    evidence.frameId = "frame_made_up";
    const issues = validateProvenance(assessment, sampleProvenanceContext());
    expect(issues.map((issue) => issue.code)).toEqual(["unknown_frame"]);
    expect(evidence.timestampSeconds).toBe(7.4);
    expect(evidence.frameId).toBe("frame_made_up");
  });

  it("rejects a timestamp that does not match the frame", () => {
    const assessment = parsedSample();
    const evidence = assessment.findings[0]?.evidence[0];
    if (!evidence) {
      throw new Error("sample evidence missing");
    }
    evidence.timestampSeconds = 11;
    const issues = validateProvenance(assessment, sampleProvenanceContext());
    expect(issues.map((issue) => issue.code)).toEqual(["timestamp_mismatch"]);
    expect(evidence.timestampSeconds).toBe(11);
  });

  it("allows a timestamp inside the rounding tolerance and rejects one outside it", () => {
    const inside = parsedSample();
    const insideEvidence = inside.findings[0]?.evidence[0];
    if (!insideEvidence) {
      throw new Error("sample evidence missing");
    }
    insideEvidence.timestampSeconds = 7.6;
    expect(validateProvenance(inside, sampleProvenanceContext())).toEqual([]);

    const outside = parsedSample();
    const outsideEvidence = outside.findings[0]?.evidence[0];
    if (!outsideEvidence) {
      throw new Error("sample evidence missing");
    }
    outsideEvidence.timestampSeconds = 7.66;
    expect(validateProvenance(outside, sampleProvenanceContext()).map((issue) => issue.code)).toEqual([
      "timestamp_mismatch",
    ]);
  });

  it("rejects a citation that was not retrieved", () => {
    const assessment = parsedSample();
    const citation = assessment.findings[0]?.citations[0];
    if (!citation) {
      throw new Error("sample citation missing");
    }
    citation.chunkId = "chunk_not_retrieved";
    const issues = validateProvenance(assessment, sampleProvenanceContext());
    expect(issues).toEqual([
      {
        code: "unknown_citation",
        path: "findings.0.citations.0.chunkId",
        message: "Citation references guidance that was not retrieved for this assessment.",
      },
    ]);
    expect(SAMPLE_CHUNK_ID).not.toBe(citation.chunkId);
    expect(SAMPLE_FRAME_ID).toBe("frame_001");
  });

  it("rejects a provenance context with duplicate frame ids", () => {
    const context = sampleProvenanceContext();
    const frame = context.frames[0];
    if (!frame) {
      throw new Error("sample frame missing");
    }
    const issues = validateProvenance(parsedSample(), {
      ...context,
      frames: [frame, { ...frame, timestampSeconds: 1 }],
    });
    expect(issues.map((issue) => issue.code)).toContain("duplicate_frame_id");
  });
});
