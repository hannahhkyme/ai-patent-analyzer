"use client";

import * as ScrollArea from "@radix-ui/react-scroll-area";
import type { ChatMessage } from "@/hooks/use-chat-messages";
import { MessageBubble } from "./MessageBubble";

export function ChatThread({ messages }: { messages: ChatMessage[] }) {
  return (
    <ScrollArea.Root className="h-[min(420px,50vh)] w-full rounded border border-[var(--border)] bg-[var(--navy)]/40">
      <ScrollArea.Viewport className="h-full w-full p-3">
        <div className="flex flex-col gap-2 pr-2">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Messages will appear here.</p>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none bg-[var(--surface)] p-0.5"
      >
        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[var(--gold)]/40" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
