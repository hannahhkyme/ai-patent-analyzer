import { computeAnalyzeCompleteness } from "./completeness";
import { runPatentSimilaritySearch } from "./uspto-similarity";
import { getInventionSessionStore } from "./session-store";
import type { AnalyzeResult } from "./types";

export async function analyzeInvention(sessionId: string): Promise<AnalyzeResult | null> {
  const store = getInventionSessionStore();
  const session = store.getSession(sessionId);
  if (!session) return null;

  const completeness_score = computeAnalyzeCompleteness(
    session.answers.length,
    session.description.length,
  );

  const { similar_patents, uspto_search_query } = await runPatentSimilaritySearch(session);

  return {
    completeness_score,
    missing_sections:
      completeness_score < 0.85 ? ["detailed_description", "enablement_examples"] : [],
    risk_assessment:
      "Novelty and disclosure timing must be reviewed by counsel before filing. Similar references below are informational only.",
    recommendations: [
      "Add concrete examples of how each claim element is realized in practice.",
      "Document any public use or offer for sale dates.",
    ],
    similar_patents,
    uspto_search_query,
  };
}
