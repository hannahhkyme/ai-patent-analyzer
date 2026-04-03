"use client";

import type { FilingFlowReturn } from "@/hooks/use-filing-flow";

export function StartSessionForm({ flow }: { flow: FilingFlowReturn }) {
  return (
    <section className="mb-4 max-w-xl space-y-3 rounded border border-[var(--border)] bg-[var(--surface)] p-4">
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Title
        <input
          value={flow.title}
          onChange={(e) => flow.setTitle(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--navy)] px-2 py-1.5 text-sm text-[var(--cream)]"
        />
      </label>
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Description
        <textarea
          value={flow.description}
          onChange={(e) => flow.setDescription(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--navy)] px-2 py-1.5 text-sm text-[var(--cream)]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer text-xs text-[var(--gold)] hover:underline">
          Attach PDF
          <input type="file" accept="application/pdf" className="hidden" onChange={flow.onPdf} />
        </label>
        {flow.pdf.loading ? <span className="text-xs text-[var(--muted)]">Extracting…</span> : null}
        {flow.pdf.error ? (
          <span className="text-xs text-[var(--danger)]">{flow.pdf.error}</span>
        ) : null}
        {!flow.pdf.loading && !flow.pdf.error && flow.description.trim().length > 0 ? (
          <span className="text-xs text-[var(--muted)]">
            Loaded {flow.description.trim().length.toLocaleString()} characters
          </span>
        ) : null}
      </div>
      <button
        type="button"
        disabled={flow.session.loading || !flow.title.trim() || !flow.description.trim()}
        onClick={() => void flow.onStart()}
        className="rounded border border-[var(--gold)] bg-[var(--gold)]/15 px-4 py-2 text-sm font-medium text-[var(--cream)] hover:bg-[var(--gold)]/25 disabled:opacity-50"
      >
        Start session
      </button>
    </section>
  );
}
