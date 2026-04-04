import { DEFAULT_MISSING_AFTER_START } from "./constants";
import { getInventionSessionStore } from "./session-store";
import type { StartInventionResult } from "./types";

export async function startInvention(
  title: string,
  description: string,
): Promise<StartInventionResult> {
  const store = getInventionSessionStore();
  const session = await store.createSession(title, description);
  const hasLongDescription = description.trim().length >= 400;
  return {
    session_id: session.id,
    missing_fields: [...DEFAULT_MISSING_AFTER_START],
    first_question:
      hasLongDescription
        ? "I’ve loaded your disclosure text. What’s the single most important novel mechanism or step that you believe is new (vs. what exists today)?"
        : "In one or two sentences, what problem does your invention solve, and who feels that pain today?",
  };
}
