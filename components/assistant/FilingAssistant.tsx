"use client";

import { useFilingFlow } from "@/hooks/use-filing-flow";
import { AssistantHeader } from "./AssistantHeader";
import { ChatThread } from "./ChatThread";
import { SessionActions } from "./SessionActions";
import { StartSessionForm } from "./StartSessionForm";

export function FilingAssistant() {
  const flow = useFilingFlow();

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 md:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 hero-backdrop" aria-hidden />
      <AssistantHeader />
      {flow.phase === "form" ? <StartSessionForm flow={flow} /> : null}
      <section className="max-w-3xl space-y-3">
        <ChatThread messages={flow.messages} />
        {flow.awaitingAnswer ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={flow.answer}
              onChange={(e) => flow.setAnswer(e.target.value)}
              placeholder="Your answer"
              className="flex-1 rounded border border-[var(--border)] bg-[var(--navy)] px-3 py-2 text-sm text-[var(--cream)]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void flow.onSubmitAnswer();
                }
              }}
            />
            <button
              type="button"
              disabled={flow.session.loading}
              onClick={() => void flow.onSubmitAnswer()}
              className="rounded border border-[var(--border)] bg-[var(--surface2)] px-4 py-2 text-sm text-[var(--cream)] hover:border-[var(--gold)] disabled:opacity-50"
            >
              Send
            </button>
          </div>
        ) : null}
        {flow.phase === "tools" ? (
          <SessionActions
            onAnalyze={() => void flow.onAnalyze()}
            onDraft={() => void flow.onDraft()}
            disabled={flow.session.loading}
          />
        ) : null}
        {flow.session.error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {flow.session.error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
