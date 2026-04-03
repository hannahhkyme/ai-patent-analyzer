import { getOpenAIClient } from "../openai/client";
import { generateProvisionalDraft } from "../openai/draft-model";
import { getInventionSessionStore } from "./session-store";
import type { DraftResult } from "./types";

function stubDraft(session: {
  title: string;
  description: string;
  answers: string[];
}): string {
  return [
    `# Provisional draft (offline scaffold)`,
    ``,
    `## Title`,
    session.title,
    ``,
    `## Summary`,
    session.description,
    ``,
    `## Follow-up notes`,
    ...session.answers.map((a, i) => `${i + 1}. ${a}`),
    ``,
    `_Set OPENAI_API_KEY for AI-generated draft. Not filing-ready — attorney review required._`,
  ].join("\n");
}

export async function draftProvisional(sessionId: string): Promise<DraftResult | null> {
  const store = getInventionSessionStore();
  const session = store.getSession(sessionId);
  if (!session) return null;

  const client = getOpenAIClient();
  const provisional_draft = client
    ? await generateProvisionalDraft(client, session)
    : stubDraft(session);

  return {
    provisional_draft,
    filing_date_estimate:
      "Typical: finalize with counsel, then e-file; allow time for drawings and formalities.",
    warnings: [
      "This output is a structural scaffold, not legal advice.",
      "Confirm no bars to patentability (public use, sales, publications) with counsel.",
    ],
  };
}
