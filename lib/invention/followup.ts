import { MAX_FOLLOWUP_ROUNDS, STATIC_FALLBACK_QUESTIONS } from "./constants";
import { computeFollowupCompleteness } from "./completeness";
import { generateNextFollowupQuestion } from "../openai/followup-model";
import { getOpenAIClient } from "../openai/client";
import { getInventionSessionStore } from "./session-store";
import type { FollowupResult } from "./types";


function fallbackMissingFields(score: number): string[] {
  if (score < 0.5) return ["what_makes_it_new", "public_disclosure_timeline", "figures"];
  if (score < 0.8) return ["claim_focus", "best_mode_detail"];
  return [];
}

function staticNextQuestion(answerCount: number): string | null {
  if (answerCount >= MAX_FOLLOWUP_ROUNDS) return null;
  const idx = answerCount - 1;
  if (idx < 0 || idx >= STATIC_FALLBACK_QUESTIONS.length) return null;
  return STATIC_FALLBACK_QUESTIONS[idx] ?? null;
}

export async function processFollowup(
  sessionId: string,
  answer: string,
): Promise<FollowupResult | null> {
  const store = getInventionSessionStore();
  const session = await store.appendAnswer(sessionId, answer);
  if (!session) return null;

  const answerCount = session.answers.length;
  const completeness_score = computeFollowupCompleteness(answerCount);

  const client = getOpenAIClient();
  if (!client) {
    const missing_fields = fallbackMissingFields(completeness_score);
    return {
      next_question: staticNextQuestion(answerCount),
      completeness_score,
      missing_fields,
    };
  }

  const ai = await generateNextFollowupQuestion(client, {
    title: session.title,
    description: session.description,
    answers: session.answers,
    answerCountAfterAppend: answerCount,
  });

  const missing_fields =
    ai.missing_fields.length > 0 ? ai.missing_fields : fallbackMissingFields(completeness_score);

  const next_question =
    answerCount >= MAX_FOLLOWUP_ROUNDS ? null : ai.next_question;

  return {
    next_question,
    completeness_score,
    missing_fields,
  };
}
