import type { FindingCategory, Likelihood, Severity } from "@/domain/taxonomy";
import type { ProvenanceContext } from "@/validation/provenance";

type SampleEvidence = {
  frameId: string;
  timestampSeconds: number;
  description: string;
};

type SampleCitation = {
  chunkId: string;
  relationship: "supports" | "related";
  reason: string;
};

type SampleFinding = {
  category: FindingCategory;
  title: string;
  severity: Severity;
  likelihood: Likelihood;
  confidence: number;
  observation: string;
  interpretation: string;
  recommendedControls: string[];
  evidence: SampleEvidence[];
  citations: SampleCitation[];
};

export const SAMPLE_FRAME_ID = "frame_001";
export const SAMPLE_CHUNK_ID = "chunk_slips_001";

export function sampleProvenanceContext(): ProvenanceContext {
  return {
    frames: [
      {
        frameId: SAMPLE_FRAME_ID,
        mediaId: "media_001",
        frameIndex: 0,
        timestampSeconds: 7.4,
      },
    ],
    retrievedChunkIds: [SAMPLE_CHUNK_ID],
  };
}

/** A schema-shaped object for tests. This is not a demo-mode assessment. */
export function sampleModelInput(): {
  assessmentSummary: string;
  findings: SampleFinding[];
} {
  return {
    assessmentSummary:
      "A cable appears to cross the walkway. This is an AI-assisted observation and needs human review.",
    findings: [
      {
        category: "slips_trips",
        title: "Cable across the walkway",
        severity: "medium",
        likelihood: "possible",
        confidence: 0.62,
        observation: "A cable appears to cross the pedestrian route in the supplied frame.",
        interpretation: "This may create a trip hazard.",
        recommendedControls: ["Consider rerouting or securing the cable."],
        evidence: [
          {
            frameId: SAMPLE_FRAME_ID,
            timestampSeconds: 7.4,
            description: "Cable lying across the walking route.",
          },
        ],
        citations: [
          {
            chunkId: SAMPLE_CHUNK_ID,
            relationship: "supports",
            reason: "The retrieved chunk discusses keeping walkways clear.",
          },
        ],
      },
    ],
  };
}
