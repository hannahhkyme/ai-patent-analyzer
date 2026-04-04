import Link from "next/link";
import InventorIntro from "@/components/InventorIntro";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-3 md:px-6 md:py-4">
      <div
        className="pointer-events-none absolute inset-0 -z-10 hero-backdrop"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[var(--glow)] opacity-60 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/4 -z-10 h-64 w-64 rounded-full bg-[var(--glow-2)] opacity-40 blur-3xl"
        aria-hidden
      />

      <nav className="mb-4 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
        <Link href="/app" className="hover:text-[var(--gold)]">
          Assistant
        </Link>
        <Link href="/docs" className="hover:text-[var(--gold)]">
          API reference
        </Link>
      </nav>

      <header className="mb-2 max-w-4xl">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          Disclosure → analysis → filing prep
        </p>
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-tight">
          <span className="title-shine">Protect your idea</span>
          <br />
          <span className="text-[var(--text)]">before someone else does</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-snug text-[var(--muted)]">
          Not sure if your idea qualifies as an invention? You&apos;re not alone. This workspace
          helps you find out — by searching what&apos;s already been patented, spotting what makes
          yours unique, and identifying gaps before they cost you your filing date.
        </p>
        <div className="mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            How it works
          </p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-sm leading-snug text-[var(--text)]">
            <li>
              <strong className="text-[var(--text)]">Upload</strong> your write-up or notes (PDF).
            </li>
            <li>
              <strong className="text-[var(--text)]">Analyze</strong> against what examiners expect —
              enablement, clarity, claim support.
            </li>
            <li>
              <strong className="text-[var(--text)]">Draft &amp; refine</strong> toward a cleaner
              spec and claims — then take it to counsel.
            </li>
          </ol>
        </div>
      </header>

      <InventorIntro />

      <div className="mb-6 max-w-4xl">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--surface2)] px-3 py-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--surface)]"
        >
          Start protecting my idea
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
