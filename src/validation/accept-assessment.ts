import { ZodError } from "zod";
import { initialReviewStatus } from "@/domain/taxonomy";
import { calculateRiskScore, riskBandForScore, type RiskBand } from "@/domain/risk";
import type { ReviewStatus } from "@/domain/taxonomy";
import { modelAssessmentSchema, type FindingOutput, type ModelAssessment } from "@/schemas/assessment";
import type { ValidationIssue } from "@/validation/issues";
import { validateProvenance, type ProvenanceContext } from "@/validation/provenance";

export type AssessmentDraftFinding = FindingOutput & {
  riskScore: number;
  riskBand: RiskBand;
  reviewStatus: ReviewStatus;
};

export type AssessmentDraft = {
  assessmentSummary: string;
  humanReviewRequired: true;
  findings: AssessmentDraftFinding[];
};

export type AcceptResult =
  | { ok: true; draft: AssessmentDraft }
  | { ok: false; issues: ValidationIssue[] };

function issuesFromZod(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function buildDraft(model: ModelAssessment): AssessmentDraft {
  return {
    assessmentSummary: model.assessmentSummary,
    humanReviewRequired: true,
    findings: model.findings.map((finding) => {
      const riskScore = calculateRiskScore(finding.severity, finding.likelihood);
      return {
        ...finding,
        riskScore,
        riskBand: riskBandForScore(riskScore),
        reviewStatus: initialReviewStatus(finding.category),
      };
    }),
  };
}

/**
 * Parses model output, then checks provenance.
 * On any failure the input is not turned into an assessment draft.
 * Fields are not rewritten to force a match.
 */
export function acceptModelAssessment(input: unknown, context: ProvenanceContext): AcceptResult {
  const parsed = modelAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: issuesFromZod(parsed.error) };
  }

  const provenanceIssues = validateProvenance(parsed.data, context);
  if (provenanceIssues.length > 0) {
    return { ok: false, issues: provenanceIssues };
  }

  return { ok: true, draft: buildDraft(parsed.data) };
}
