"use client";

export function SessionActions({
  onAnalyze,
  onDraft,
  disabled,
}: {
  onAnalyze: () => void;
  onDraft: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onAnalyze}
        className="rounded border border-[var(--border)] bg-[var(--surface2)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--gold)] disabled:opacity-50"
      >
        Analyze disclosure
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onDraft}
        className="rounded border border-[var(--gold)]/50 bg-transparent px-3 py-1.5 text-sm text-[var(--gold)] hover:bg-[var(--gold)]/10 disabled:opacity-50"
      >
        Generate draft
      </button>
    </div>
  );
}
