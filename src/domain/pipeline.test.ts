import { describe, expect, it } from "vitest";
import { canTransition, PIPELINE_STATES } from "@/domain/pipeline";

describe("pipeline transitions", () => {
  it("allows only the next stage", () => {
    expect(canTransition("queued", "extracting_media")).toBe(true);
    expect(canTransition("persisting", "completed")).toBe(true);
    expect(canTransition("queued", "sampling_frames")).toBe(false);
    expect(canTransition("validating", "completed")).toBe(false);
    expect(canTransition("extracting_media", "queued")).toBe(false);
  });

  it("allows failure from any in-progress stage and nowhere after a terminal state", () => {
    for (const state of PIPELINE_STATES) {
      if (state === "completed" || state === "failed") {
        expect(canTransition(state, "failed")).toBe(false);
        expect(canTransition(state, "queued")).toBe(false);
      } else {
        expect(canTransition(state, "failed")).toBe(true);
      }
    }
  });
});
