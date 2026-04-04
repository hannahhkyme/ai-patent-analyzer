"use client";

import Link from "next/link";

export function AssistantHeader() {
  return (
    <header className="mb-6 flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--cream)]">
          ← Home
        </Link>
        <h1 className="font-display mt-2 text-2xl font-medium text-[var(--cream)]">
          Filing assistant
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
          Answer questions, then run analysis and generate a provisional patent application draft.
        </p>
      </div>
      <Link href="/docs" className="text-sm text-[var(--gold)] underline-offset-2 hover:underline">
        API reference
      </Link>
    </header>
  );
}
