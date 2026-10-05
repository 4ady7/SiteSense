import { z } from "zod";
import { FINDING_CATEGORIES, LIKELIHOODS, SEVERITIES } from "@/domain/taxonomy";

const identifierSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

export const evidenceReferenceSchema = z
  .object({
    frameId: identifierSchema,
    timestampSeconds: z.number().finite().nonnegative(),
    description: z.string().min(1).max(2000),
  })
  .strict();

export const citationReferenceSchema = z
  .object({
    chunkId: identifierSchema,
    relationship: z.enum(["supports", "related"]),
    reason: z.string().min(1).max(2000),
  })
  .strict();

/**
 * Model output for one finding.
 * Likelihood is required so the application can calculate a risk score.
 * A missing likelihood is rejected. It is never defaulted.
 * riskScore, review status, and free-form citations are not accepted fields.
 */
export const findingOutputSchema = z
  .object({
    category: z.enum(FINDING_CATEGORIES),
    title: z.string().min(1).max(200),
    severity: z.enum(SEVERITIES),
    likelihood: z.enum(LIKELIHOODS),
    confidence: z.number().finite().min(0).max(1),
    observation: z.string().min(1).max(4000),
    interpretation: z.string().min(1).max(4000),
    recommendedControls: z.array(z.string().min(1).max(500)).min(1).max(10),
    evidence: z.array(evidenceReferenceSchema).min(1).max(20),
    citations: z.array(citationReferenceSchema).max(10),
  })
  .strict();

export const modelAssessmentSchema = z
  .object({
    assessmentSummary: z.string().min(1).max(4000),
    findings: z.array(findingOutputSchema).max(30),
  })
  .strict();

export type EvidenceReference = z.infer<typeof evidenceReferenceSchema>;
export type CitationReference = z.infer<typeof citationReferenceSchema>;
export type FindingOutput = z.infer<typeof findingOutputSchema>;
export type ModelAssessment = z.infer<typeof modelAssessmentSchema>;
