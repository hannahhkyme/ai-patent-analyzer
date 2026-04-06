import Link from "next/link";
import { API_ENDPOINTS } from "@/lib/api-reference";

export default function DocsPage() {
  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <div className="pointer-events-none fixed inset-0 -z-10 hero-backdrop" aria-hidden />
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--gold)]">
          ← Home
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
          Reference
        </p>
        <h1 className="font-display mt-2 text-3xl font-medium tracking-tight text-[var(--cream)]">
          HTTP API
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Endpoints are defined in{" "}
          <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs text-[var(--cream)]">
            lib/api-reference.ts
          </code>
          . Run{" "}
          <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs text-[var(--cream)]">
            npm run verify:api
          </code>{" "}
          to compare this catalog to App Router handlers.
        </p>

        <ul className="mt-10 flex flex-col gap-8 border-t border-[var(--border)] pt-8">
          {API_ENDPOINTS.map((ep) => (
            <li
              key={`${ep.method}-${ep.path}`}
              className="rounded border border-[var(--border)] bg-[var(--surface)]/80 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded bg-[var(--gold)]/15 px-2 py-0.5 font-mono text-xs font-semibold text-[var(--gold)]">
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-[var(--cream)]">{ep.path}</code>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{ep.summary}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Request
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-[var(--cream)]">
                    {ep.requestFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Response
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-[var(--cream)]">
                    {ep.responseFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {ep.notes && ep.notes.length > 0 && (
                <div className="mt-4 border-t border-[var(--border)] pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Error responses
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-[var(--cream)]/80">
                    {ep.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
