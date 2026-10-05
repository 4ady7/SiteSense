import type { ModelAssessment } from "@/schemas/assessment";
import type { ValidationIssue } from "@/validation/issues";

export type KnownFrame = {
  frameId: string;
  mediaId: string;
  frameIndex: number;
  timestampSeconds: number;
};

export type ProvenanceContext = {
  frames: readonly KnownFrame[];
  retrievedChunkIds: readonly string[];
  timestampToleranceSeconds?: number;
};

/** Rounding allowance. A larger gap is treated as a fabricated timestamp. */
export const DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 0.25;

/**
 * Checks evidence and citations against frames and chunks the application supplied.
 * Does not rewrite timestamps, drop findings, or substitute citations.
 */
export function validateProvenance(
  assessment: ModelAssessment,
  context: ProvenanceContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const framesById = new Map<string, KnownFrame>();

  for (const frame of context.frames) {
    if (framesById.has(frame.frameId)) {
      issues.push({
        code: "duplicate_frame_id",
        path: `frames.${frame.frameId}`,
        message: "Provenance context contains a duplicate frame id.",
      });
      continue;
    }
    framesById.set(frame.frameId, frame);
  }

  const retrievedChunkIds = new Set(context.retrievedChunkIds);
  const tolerance = context.timestampToleranceSeconds ?? DEFAULT_TIMESTAMP_TOLERANCE_SECONDS;

  assessment.findings.forEach((finding, findingIndex) => {
    finding.evidence.forEach((evidence, evidenceIndex) => {
      const path = `findings.${findingIndex}.evidence.${evidenceIndex}`;
      const frame = framesById.get(evidence.frameId);
      if (!frame) {
        issues.push({
          code: "unknown_frame",
          path: `${path}.frameId`,
          message: "Evidence references a frame that was not supplied to the assessment.",
        });
        return;
      }

      const delta = Math.abs(evidence.timestampSeconds - frame.timestampSeconds);
      if (delta > tolerance) {
        issues.push({
          code: "timestamp_mismatch",
          path: `${path}.timestampSeconds`,
          message: "Evidence timestamp does not match the stored frame timestamp.",
        });
      }
    });

    finding.citations.forEach((citation, citationIndex) => {
      if (!retrievedChunkIds.has(citation.chunkId)) {
        issues.push({
          code: "unknown_citation",
          path: `findings.${findingIndex}.citations.${citationIndex}.chunkId`,
          message: "Citation references guidance that was not retrieved for this assessment.",
        });
      }
    });
  });

  return issues;
}
