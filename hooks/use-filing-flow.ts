"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useInventionSession } from "@/hooks/use-invention-session";
import { usePdfUpload } from "@/hooks/use-pdf-upload";

export type FilingPhase = "form" | "chat" | "tools";

export type FilingFlowReturn = {
  messages: ReturnType<typeof useChatMessages>["messages"];
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  answer: string;
  setAnswer: (v: string) => void;
  awaitingAnswer: boolean;
  phase: FilingPhase;
  session: ReturnType<typeof useInventionSession>;
  pdf: ReturnType<typeof usePdfUpload>;
  onStart: () => Promise<void>;
  onSubmitAnswer: () => Promise<void>;
  onAnalyze: () => Promise<void>;
  onDraft: () => Promise<void>;
  onPdf: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function useFilingFlow(): FilingFlowReturn {
  const { messages, addMessage, addAnalysis, addDraft, clear } = useChatMessages();
  const session = useInventionSession();
  const pdf = usePdfUpload();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answer, setAnswer] = useState("");
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [phase, setPhase] = useState<FilingPhase>("form");

  const onStart = useCallback(async () => {
    const res = await session.start(title.trim(), description.trim());
    if (!res) return;
    clear();
    addMessage("assistant", res.first_question);
    setAwaitingAnswer(true);
    setPhase("chat");
  }, [session, title, description, clear, addMessage]);

  const onSubmitAnswer = useCallback(async () => {
    const text = answer.trim();
    if (!text) return;
    addMessage("user", text);
    setAnswer("");
    const res = await session.followup(text);
    if (!res) return;
    if (res.next_question) {
      addMessage("assistant", res.next_question);
    } else {
      addMessage(
        "assistant",
        `Follow-up complete (completeness ${(res.completeness_score * 100).toFixed(0)}%). You can analyze or draft when ready.`,
      );
      setAwaitingAnswer(false);
      setPhase("tools");
    }
  }, [answer, session, addMessage]);

  const onAnalyze = useCallback(async () => {
    const res = await session.analyze();
    if (!res) return;
    addAnalysis(res);
  }, [session, addAnalysis]);

  const onDraft = useCallback(async () => {
    const res = await session.draft();
    if (!res) return;
    addDraft(res);
  }, [session, addDraft]);

  const onPdf = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const res = await pdf.upload(file);
      if (res) setDescription((d) => (d ? `${d}\n\n${res.text}` : res.text));
    },
    [pdf],
  );

  return {
    messages,
    title,
    setTitle,
    description,
    setDescription,
    answer,
    setAnswer,
    awaitingAnswer,
    phase,
    session,
    pdf,
    onStart,
    onSubmitAnswer,
    onAnalyze,
    onDraft,
    onPdf,
  };
}
