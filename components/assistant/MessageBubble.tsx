"use client";

import type { ChatMessage } from "@/hooks/use-chat-messages";
import type { AnalyzeResult, DraftResult } from "@/lib/invention/types";

function AnalysisBubble({ data }: { data: AnalyzeResult }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold text-[var(--gold)]">
        Analysis — {(data.completeness_score * 100).toFixed(0)}% complete
      </p>
      <p className="leading-snug">{data.risk_assessment}</p>
      {data.uspto_search_query ? (
        <p className="text-xs text-[var(--muted)]">USPTO query: {data.uspto_search_query}</p>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Recommendations
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {data.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      {data.similar_patents.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Similar references
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-[var(--muted)]">
            {data.similar_patents.map((p) => (
              <li key={p.id ?? p.title}>
                {p.title}
                {p.id ? ` — ${p.id}` : ""}
                {p.snippet ? `: ${p.snippet}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DraftBubble({ data }: { data: DraftResult }) {
  return (
    <div className="space-y-2 text-sm">
      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
        {data.provisional_draft}
      </pre>
      <p className="text-xs text-[var(--muted)]">{data.filing_date_estimate}</p>
      {data.warnings.length > 0 ? (
        <ul className="space-y-0.5 text-xs text-[var(--danger)]">
          {data.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`max-w-[92%] rounded-lg border px-3 py-2 text-sm leading-snug ${
        isUser
          ? "ml-auto border-[var(--border)] bg-[var(--surface2)] text-[var(--text)]"
          : "border-[var(--border)]/80 bg-[var(--surface)] text-[var(--cream)]"
      }`}
    >
      {message.role === "system" ? (
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">System · </span>
      ) : null}
      {message.kind === "analysis" ? (
        <AnalysisBubble data={message.data} />
      ) : message.kind === "draft" ? (
        <DraftBubble data={message.data} />
      ) : (
        <span className="whitespace-pre-wrap">{message.content}</span>
      )}
    </div>
  );
}
