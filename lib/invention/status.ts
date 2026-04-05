import { computeStatusCompleteness } from "./completeness";
import { getInventionSessionStore } from "./session-store";
import type { StatusResult } from "./types";

export async function getInventionStatus(sessionId: string): Promise<StatusResult | null> {
  const store = getInventionSessionStore();
  const session = await store.getSession(sessionId);
  if (!session) return null;

  // If analyze has already run, use those AI-derived values.
  // Otherwise fall back to math-based estimates so status is always usable.
  const completeness_score =
    session.lastAnalysis?.completeness_score ??
    computeStatusCompleteness(session.answers.length, session.description.length);

  const sections_missing =
    session.lastAnalysis?.missing_sections ?? [
      ...(session.description.length < 120 ? ["specification_detail"] : []),
      ...(session.answers.length < 2 ? ["novelty_and_differences"] : []),
      "formal_claims",
      "abstract",
      "oath_declaration",
    ];

  // sections_complete reflects what the user has actually submitted.
  const sections_complete = ["title", "initial_description"];
  if (session.answers.length >= 1) sections_complete.push("problem_statement");
  if (session.answers.length >= 2) sections_complete.push("differentiation");
  if (session.answers.length >= 3) sections_complete.push("disclosure_timeline");

  const ready_to_file = completeness_score >= 0.85 && session.answers.length >= 3;

  return {
    completeness_score,
    sections_complete,
    sections_missing,
    ready_to_file,
  };
}
