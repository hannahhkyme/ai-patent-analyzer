import { computeAnalyzeCompleteness } from "./completeness";
import { runPatentSimilaritySearch } from "./uspto-similarity";
import { getInventionSessionStore } from "./session-store";
import { getOpenAIClient } from "../openai/client";
import { analyzePatentability } from "../openai/analyze-model";
import type { AnalyzeResult } from "./types";

export async function analyzeInvention(sessionId: string): Promise<AnalyzeResult | null> {
  const store = getInventionSessionStore();
  const session = await store.getSession(sessionId);
  if (!session) return null;

  const client = getOpenAIClient();

  // Run patent similarity search and AI patentability analysis in parallel.
  const [similarityResult, aiAnalysis] = await Promise.all([
    runPatentSimilaritySearch(session),
    client
      ? analyzePatentability(client, {
          title: session.title,
          description: session.description,
          answers: session.answers,
        })
      : Promise.resolve(null),
  ]);

  const { similar_patents, uspto_search_query } = similarityResult;

  // Use AI-derived values when available; fall back to heuristics otherwise.
  const completeness_score =
    aiAnalysis?.completeness_score ??
    computeAnalyzeCompleteness(session.answers.length, session.description.length);

  const missing_sections =
    aiAnalysis?.missing_sections ??
    (completeness_score < 0.85 ? ["detailed_description", "enablement_examples"] : []);

  const risk_assessment =
    aiAnalysis?.risk_assessment ??
    "Novelty and disclosure timing must be reviewed by counsel before filing. Similar references below are informational only.";

  const recommendations =
    aiAnalysis?.recommendations ?? [
      "Add concrete examples of how each claim element is realized in practice.",
      "Document any public use or offer for sale dates.",
    ];

  return {
    completeness_score,
    missing_sections,
    risk_assessment,
    recommendations,
    similar_patents,
    uspto_search_query,
  };
}
