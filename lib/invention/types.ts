export type SessionAnalysis = {
  completeness_score: number;
  missing_sections: string[];
};

export type InventionSession = {
  id: string;
  title: string;
  description: string;
  answers: string[];
  createdAt: number;
  lastAnalysis?: SessionAnalysis;
};

export type StartInventionResult = {
  session_id: string;
  missing_fields: string[];
  first_question: string;
};

export type FollowupResult = {
  next_question: string | null;
  completeness_score: number;
  missing_fields: string[];
};

export type SimilarPatentRef = {
  title: string;
  id?: string;
  snippet?: string;
};

export type AnalyzeResult = {
  completeness_score: number;
  missing_sections: string[];
  risk_assessment: string;
  recommendations: string[];
  similar_patents: SimilarPatentRef[];
  /** Query string sent to USPTO search (when a key is configured); omitted if search was skipped. */
  uspto_search_query?: string;
};

export type DraftResult = {
  provisional_draft: string;
  filing_date_estimate: string;
  warnings: string[];
};

export type StatusResult = {
  completeness_score: number;
  sections_complete: string[];
  sections_missing: string[];
  ready_to_file: boolean;
};
