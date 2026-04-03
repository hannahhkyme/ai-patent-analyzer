/**
 * Max answers stored on the session from the chat follow-up loop before analysis.
 * Flow: first question comes from /start; then up to (MAX_FOLLOWUP_ROUNDS - 1) more questions
 * are asked via /followup so the user answers at most MAX_FOLLOWUP_ROUNDS times total.
 */
export const MAX_FOLLOWUP_ROUNDS = 3;

export const COMPLETENESS_BASE = 0.2;
export const COMPLETENESS_PER_ANSWER = 0.18;
export const COMPLETENESS_CAP = 0.95;

export const ANALYZE_COMPLETENESS_CAP = 0.92;
export const ANALYZE_COMPLETENESS_BASE = 0.25;
export const ANALYZE_COMPLETENESS_PER_ANSWER = 0.15;
export const ANALYZE_DESCRIPTION_THRESHOLD = 200;
export const ANALYZE_DESCRIPTION_BONUS = 0.15;

export const STATUS_COMPLETENESS_CAP = 0.9;
export const STATUS_COMPLETENESS_BASE = 0.2;
export const STATUS_COMPLETENESS_PER_ANSWER = 0.12;
export const STATUS_DESCRIPTION_THRESHOLD = 150;
export const STATUS_DESCRIPTION_BONUS = 0.1;

export const STATIC_FALLBACK_QUESTIONS = [
  "How is your approach different from what people already do today (tools, products, or methods)?",
  "Have you shown or sold this to anyone outside a confidential NDA? If yes, roughly when?",
  "Do you have sketches, photos, or diagrams that show the invention? Describe them briefly.",
] as const;

export const DEFAULT_MISSING_AFTER_START = [
  "how_it_works",
  "what_makes_it_new",
  "drawings_or_figures",
  "first_use_date_or_public_disclosure",
] as const;

export const OPENAI_MODEL = "gpt-4o" as const;

export const OPENAI_MAX_TOKENS_FOLLOWUP = 400;
export const OPENAI_MAX_TOKENS_DRAFT = 4096;
export const OPENAI_MAX_TOKENS_USPTO_QUERY = 350;
