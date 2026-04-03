import { USPTO_QUERY_MAX_CHARS } from "./constants";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "her",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "its",
  "may",
  "new",
  "now",
  "old",
  "see",
  "two",
  "way",
  "who",
  "boy",
  "did",
  "let",
  "put",
  "say",
  "she",
  "too",
  "use",
  "that",
  "this",
  "with",
  "have",
  "from",
  "they",
  "been",
  "into",
  "more",
  "than",
  "some",
  "time",
  "very",
  "when",
  "your",
  "about",
  "after",
  "also",
  "back",
  "because",
  "before",
  "being",
  "between",
  "both",
  "each",
  "few",
  "first",
  "had",
  "here",
  "just",
  "like",
  "long",
  "made",
  "make",
  "many",
  "most",
  "much",
  "only",
  "other",
  "over",
  "such",
  "than",
  "them",
  "then",
  "there",
  "these",
  "those",
  "through",
  "under",
  "until",
  "using",
  "well",
  "were",
  "what",
  "where",
  "which",
  "while",
  "will",
  "with",
  "would",
  "any",
  "the",
  "a",
  "an",
]);

function normalizeWords(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return [...new Set(raw)];
}

/**
 * Keyword line for USPTO `q` when OpenAI is unavailable: title + description terms, de-duplicated.
 */
export function buildHeuristicUsptoQuery(title: string, description: string): string {
  const titleWords = normalizeWords(title);
  const bodyWords = normalizeWords(description.slice(0, 2500));
  const merged = [...titleWords, ...bodyWords];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const w of merged) {
    if (seen.has(w)) continue;
    seen.add(w);
    ordered.push(w);
  }
  return ordered.join(" ").slice(0, USPTO_QUERY_MAX_CHARS).trim();
}

export function buildTitleOnlyUsptoQuery(title: string): string {
  return normalizeWords(title).join(" ").slice(0, USPTO_QUERY_MAX_CHARS).trim() || title.trim().slice(0, USPTO_QUERY_MAX_CHARS);
}

export function isUsptoEmptyResultsPlaceholder(results: { title: string }[]): boolean {
  return (
    results.length === 1 &&
    results[0].title === "No similar applications returned"
  );
}
