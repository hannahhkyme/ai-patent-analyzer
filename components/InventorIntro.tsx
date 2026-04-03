import LegalDisclaimer from "./LegalDisclaimer";

export default function InventorIntro() {
  return (
    <section
      className="mb-2 max-w-4xl rounded border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-snug text-[var(--text)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
      aria-labelledby="stakes-heading"
    >
      <h2 id="stakes-heading" className="font-display text-base font-medium text-[var(--text)]">
        Why this matters
      </h2>
      <div className="mt-2 space-y-1.5 rounded-md border border-[var(--border)]/70 bg-[rgba(255,255,255,0.095)] p-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
        <p className="text-[13px] text-[var(--muted)]">
          The earlier you file, the earlier you establish your place in line vs others patenting the
          same idea. After a patent issues, that ties into when you can assert your rights against
          infringers. Rules depend on your facts and claims.
        </p>
        <p className="text-[13px] text-[var(--muted)]">
          A provisional can lock an early date; a non-provisional builds on it if the first filing
          was complete enough. This tool helps you catch gaps <em>before</em> you file.
        </p>
      </div>
      <LegalDisclaimer />
    </section>
  );
}
