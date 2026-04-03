"use client";

import dynamic from "next/dynamic";
import * as Tabs from "@radix-ui/react-tabs";
import LegalDisclaimer from "./LegalDisclaimer";

const PatentChecklist = dynamic(() => import("./PatentChecklist"), {
  ssr: false,
  loading: () => (
    <p className="text-xs text-[var(--muted)]" aria-live="polite">
      Loading checklist…
    </p>
  ),
});

const tabTrigger =
  "shrink-0 rounded-t border border-b-0 border-transparent px-3 py-1.5 text-sm text-[var(--muted)] outline-none transition-colors duration-150 hover:text-[var(--text)] data-[state=active]:border-[var(--border)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-[inset_0_-2px_0_0_var(--accent)]";

const panel =
  "border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-snug shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

export default function LandingTabs() {
  return (
    <Tabs.Root defaultValue="patent" className="flex w-full max-w-4xl flex-col gap-2">
      <Tabs.List
        className="flex flex-wrap gap-0 border-b border-[var(--border)]"
        aria-label="Patent application sections"
      >
        <Tabs.Trigger className={tabTrigger} value="patent">
          Patent &amp; MPEP
        </Tabs.Trigger>
        <Tabs.Trigger className={tabTrigger} value="checklist">
          Checklist
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="patent" className={panel}>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Short orientation only — not legal advice. Official guidance:{" "}
          <a
            href="https://www.uspto.gov/web/offices/pac/mpep/mpep-0600.pdf"
            className="text-[var(--accent)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            MPEP Chapter 600 (PDF)
          </a>
          .
        </p>
        <ul className="space-y-2 text-[var(--text)]">
          <li>
            <span className="font-semibold text-[var(--text)]">Specification</span> — describes
            the invention so a person skilled in the field can make and use it (written
            description, enablement). Often includes title, cross-reference, background, summary,
            brief description of drawings, and detailed description.
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">Claims</span> — define the legal
            scope of protection; must be definite and supported by the specification.
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">Abstract</span> — concise summary for
            searching; cannot be used to interpret claim scope.
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">Drawings</span> — when they help
            understand the invention; referenced in the spec.
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">Oath / declaration</span> — inventor
            statements; fees and filing formalities apply at submission.
          </li>
        </ul>
        <LegalDisclaimer />
      </Tabs.Content>

      <Tabs.Content value="checklist" className={panel}>
        <PatentChecklist />
      </Tabs.Content>
    </Tabs.Root>
  );
}
