export const PIPELINE_STATES = [
  "queued",
  "extracting_media",
  "sampling_frames",
  "transcribing",
  "analysing_evidence",
  "retrieving_guidance",
  "validating",
  "persisting",
  "completed",
  "failed",
] as const;

export type PipelineState = (typeof PIPELINE_STATES)[number];

const PROGRESSION = [
  "queued",
  "extracting_media",
  "sampling_frames",
  "transcribing",
  "analysing_evidence",
  "retrieving_guidance",
  "validating",
  "persisting",
  "completed",
] as const satisfies readonly PipelineState[];

export function canTransition(from: PipelineState, to: PipelineState): boolean {
  if (from === "completed" || from === "failed") {
    return false;
  }
  if (to === "failed") {
    return true;
  }
  const fromIndex = PROGRESSION.indexOf(from);
  const toIndex = PROGRESSION.indexOf(to);
  return toIndex === fromIndex + 1;
}
