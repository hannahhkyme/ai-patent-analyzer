import { computeStatusCompleteness } from "./completeness";
import { getInventionSessionStore } from "./session-store";
import type { StatusResult } from "./types";

export async function getInventionStatus(sessionId: string): Promise<StatusResult | null> {
  const store = getInventionSessionStore();
  const session = await store.getSession(sessionId);
  if (!session) return null;

  const completeness_score = computeStatusCompleteness(
    session.answers.length,
    session.description.length,
  );

  const sections_complete = ["title", "initial_description"];
  if (session.answers.length >= 1) sections_complete.push("problem_statement");
  if (session.answers.length >= 2) sections_complete.push("differentiation");
  if (session.answers.length >= 3) sections_complete.push("disclosure_timeline");

  const sections_missing: string[] = ["formal_claims", "abstract", "oath_declaration"];
  if (session.answers.length < 2) sections_missing.unshift("novelty_and_differences");
  if (session.description.length < 120) sections_missing.unshift("specification_detail");

  const ready_to_file = completeness_score >= 0.85 && session.answers.length >= 3;

  return {
    completeness_score,
    sections_complete,
    sections_missing,
    ready_to_file,
  };
}
