import {
  COMPLETENESS_BASE,
  COMPLETENESS_CAP,
  COMPLETENESS_PER_ANSWER,
  ANALYZE_COMPLETENESS_BASE,
  ANALYZE_COMPLETENESS_CAP,
  ANALYZE_COMPLETENESS_PER_ANSWER,
  ANALYZE_DESCRIPTION_BONUS,
  ANALYZE_DESCRIPTION_THRESHOLD,
  STATUS_COMPLETENESS_BASE,
  STATUS_COMPLETENESS_CAP,
  STATUS_COMPLETENESS_PER_ANSWER,
  STATUS_DESCRIPTION_BONUS,
  STATUS_DESCRIPTION_THRESHOLD,
} from "./constants";
import type { DisclosureConfidence } from "./types";

export function confidenceFromCompletenessScore(score: number): DisclosureConfidence {
  if (score >= 0.85) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}
export function computeFollowupCompleteness(answerCount: number): number {
  return Math.min(COMPLETENESS_CAP, COMPLETENESS_BASE + answerCount * COMPLETENESS_PER_ANSWER);
}

export function computeAnalyzeCompleteness(answerCount: number, descriptionLength: number): number {
  return Math.min(
    ANALYZE_COMPLETENESS_CAP,
    ANALYZE_COMPLETENESS_BASE +
      answerCount * ANALYZE_COMPLETENESS_PER_ANSWER +
      (descriptionLength > ANALYZE_DESCRIPTION_THRESHOLD ? ANALYZE_DESCRIPTION_BONUS : 0),
  );
}

export function computeStatusCompleteness(answerCount: number, descriptionLength: number): number {
  return Math.min(
    STATUS_COMPLETENESS_CAP,
    STATUS_COMPLETENESS_BASE +
      answerCount * STATUS_COMPLETENESS_PER_ANSWER +
      (descriptionLength > STATUS_DESCRIPTION_THRESHOLD ? STATUS_DESCRIPTION_BONUS : 0),
  );
}
