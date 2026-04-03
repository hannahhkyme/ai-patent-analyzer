"use client";

import { useCallback, useState } from "react";
import type { AnalyzeResult, DraftResult } from "@/lib/invention/types";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage =
  | { id: string; role: ChatRole; kind: "text"; content: string }
  | { id: string; role: "assistant"; kind: "analysis"; data: AnalyzeResult }
  | { id: string; role: "assistant"; kind: "draft"; data: DraftResult };

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatMessages(initial: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);

  const addMessage = useCallback((role: ChatRole, content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role, kind: "text", content }]);
  }, []);

  const addAnalysis = useCallback((data: AnalyzeResult) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", kind: "analysis", data }]);
  }, []);

  const addDraft = useCallback((data: DraftResult) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", kind: "draft", data }]);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, addMessage, addAnalysis, addDraft, clear };
}
