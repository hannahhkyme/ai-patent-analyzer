export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiEndpointSpec = {
  readonly method: HttpMethod;
  /** App Router path, e.g. /api/invention/start */
  readonly path: string;
  readonly summary: string;
  readonly requestFields: readonly string[];
  readonly responseFields: readonly string[];
};

export const API_ENDPOINTS: readonly ApiEndpointSpec[] = [
  {
    method: "POST",
    path: "/api/invention/start",
    summary: "Begin a filing session with title and description.",
    requestFields: ["title", "description"],
    responseFields: ["session_id", "missing_fields", "first_question", "disclosure_length"],
  },
  {
    method: "POST",
    path: "/api/invention/followup",
    summary: "Submit an answer; receive the next follow-up question and completeness.",
    requestFields: ["session_id", "answer"],
    responseFields: ["next_question", "completeness_score", "missing_fields"],
  },
  {
    method: "POST",
    path: "/api/invention/analyze",
    summary: "Run analysis on collected disclosure (includes similar-patent hints when configured).",
    requestFields: ["session_id"],
    responseFields: [
      "completeness_score",
      "missing_sections",
      "risk_assessment",
      "recommendations",
      "similar_patents",
      "uspto_search_query",
    ],
  },
  {
    method: "POST",
    path: "/api/invention/draft",
    summary: "Generate a provisional specification scaffold (not filing-ready).",
    requestFields: ["session_id"],
    responseFields: ["provisional_draft", "filing_date_estimate", "warnings"],
  },
  {
    method: "GET",
    path: "/api/invention/status/[session_id]",
    summary: "Poll session completeness and section checklist.",
    requestFields: [],
    responseFields: [
      "completeness_score",
      "sections_complete",
      "sections_missing",
      "ready_to_file",
    ],
  },
  {
    method: "POST",
    path: "/api/upload",
    summary: "Upload a PDF; returns extracted plain text for disclosure intake.",
    requestFields: ["multipart file field"],
    responseFields: ["text"],
  },
] as const;
