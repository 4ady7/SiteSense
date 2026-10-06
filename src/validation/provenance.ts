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

/** Rounding allowance. Callers may tighten it. They may not widen it. */
export const DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 0.25;

const FRAME_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function invalidFrameRecord(frame: KnownFrame): ValidationIssue | undefined {
  const frameLabel = FRAME_ID_PATTERN.test(frame.frameId) ? frame.frameId : "invalid";
  if (!FRAME_ID_PATTERN.test(frame.frameId) || !FRAME_ID_PATTERN.test(frame.mediaId)) {
    return {
      code: "invalid_frame_record",
      path: `frames.${frameLabel}`,
      message: "Frame record is missing a usable frame id or media id.",
    };
  }
  if (!Number.isInteger(frame.frameIndex) || frame.frameIndex < 0) {
    return {
      code: "invalid_frame_record",
      path: `frames.${frame.frameId}.frameIndex`,
      message: "Frame index must be a non-negative integer.",
    };
  }
  if (!Number.isFinite(frame.timestampSeconds) || frame.timestampSeconds < 0) {
    return {
      code: "invalid_frame_record",
      path: `frames.${frame.frameId}.timestampSeconds`,
      message: "Stored frame timestamp must be a finite non-negative number.",
    };
  }
  return undefined;
}

/**
 * Checks evidence and citations against frames and chunks the application supplied.
 * Does not rewrite timestamps, drop findings, or substitute citations.
 * A corrupt frame list fails closed before any evidence is treated as a match.
 */
export function validateProvenance(
  assessment: ModelAssessment,
  context: ProvenanceContext,
): ValidationIssue[] {
  const tolerance = context.timestampToleranceSeconds ?? DEFAULT_TIMESTAMP_TOLERANCE_SECONDS;
  if (
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    tolerance > DEFAULT_TIMESTAMP_TOLERANCE_SECONDS
  ) {
    return [
      {
        code: "invalid_timestamp_tolerance",
        path: "timestampToleranceSeconds",
        message: "Timestamp tolerance must be from 0 through 0.25 seconds.",
      },
    ];
  }

  const issues: ValidationIssue[] = [];
  const framesById = new Map<string, KnownFrame>();
  const frameIndexes = new Set<number>();
  const mediaIds = new Set<string>();

  for (const frame of context.frames) {
    const recordIssue = invalidFrameRecord(frame);
    if (recordIssue) {
      issues.push(recordIssue);
      continue;
    }
    if (framesById.has(frame.frameId)) {
      issues.push({
        code: "duplicate_frame_id",
        path: `frames.${frame.frameId}`,
        message: "Provenance context contains a duplicate frame id.",
      });
      continue;
    }
    if (frameIndexes.has(frame.frameIndex)) {
      issues.push({
        code: "duplicate_frame_index",
        path: `frames.${frame.frameId}.frameIndex`,
        message: "Provenance context contains two frames with the same index.",
      });
      continue;
    }
    framesById.set(frame.frameId, frame);
    frameIndexes.add(frame.frameIndex);
    mediaIds.add(frame.mediaId);
  }

  if (mediaIds.size > 1) {
    issues.push({
      code: "mixed_media",
      path: "frames",
      message: "Provenance context mixes frames from more than one media item.",
    });
  }

  if (issues.length > 0) {
    return issues;
  }

  const retrievedChunkIds = new Set(context.retrievedChunkIds);

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
