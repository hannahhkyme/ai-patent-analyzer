"use client";

import { useEffect, useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { PATENT_CHECKLIST_ITEMS } from "./patent-checklist-items";

const STORAGE_KEY = "patent-app-checklist-v1";

function loadFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveToStorage(next: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export default function PatentChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadFromStorage);

  useEffect(() => {
    saveToStorage(checked);
  }, [checked]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reset = () => {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Progress
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Reset
          </button>
        </div>
        <ul className="flex flex-col gap-1.5">
          {PATENT_CHECKLIST_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5 transition-colors hover:border-[var(--gold)]/40"
            >
              <input
                id={`chk-${item.id}`}
                type="checkbox"
                checked={Boolean(checked[item.id])}
                onChange={() => toggle(item.id)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--gold)]"
              />
              <label
                htmlFor={`chk-${item.id}`}
                className="flex-1 cursor-pointer text-sm leading-snug"
              >
                {item.label}
              </label>
              {item.hint ? (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      className="shrink-0 rounded px-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                      aria-label={`Help: ${item.label}`}
                    >
                      ?
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="max-w-[220px] rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5 text-xs leading-snug text-[var(--text)] shadow-lg"
                      sideOffset={4}
                    >
                      {item.hint}
                      <Tooltip.Arrow className="fill-[var(--surface2)]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </Tooltip.Provider>
  );
}
