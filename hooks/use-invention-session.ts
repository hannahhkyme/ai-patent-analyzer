"use client";

import { useCallback, useState } from "react";
import type {
  StartInventionResult,
  FollowupResult,
  AnalyzeResult,
  DraftResult,
} from "@/lib/invention/types";
import { isRecord, extractErrorMessage } from "@/lib/utils";

export function useInventionSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback(
    async (title: string, description: string) => {
      return run(async () => {
        const res = await fetch("/api/invention/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg = extractErrorMessage(data, "Start failed");
          throw new Error(msg);
        }
        if (
          !isRecord(data) ||
          typeof data.session_id !== "string" ||
          !Array.isArray(data.missing_fields) ||
          typeof data.first_question !== "string"
        ) {
          throw new Error("Invalid start response");
        }
        setSessionId(data.session_id);
        return data as StartInventionResult;
      });
    },
    [run],
  );

  const followup = useCallback(
    async (answer: string) => {
      if (!sessionId) return null;
      return run(async () => {
        const res = await fetch("/api/invention/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, answer }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg = extractErrorMessage(data, "Follow-up failed");
          throw new Error(msg);
        }
        return data as FollowupResult;
      });
    },
    [run, sessionId],
  );

  const analyze = useCallback(async () => {
    if (!sessionId) return null;
    return run(async () => {
      const res = await fetch("/api/invention/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg = extractErrorMessage(data, "Analyze failed");
        throw new Error(msg);
      }
      return data as AnalyzeResult;
    });
  }, [run, sessionId]);

  const draft = useCallback(async () => {
    if (!sessionId) return null;
    return run(async () => {
      const res = await fetch("/api/invention/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg = extractErrorMessage(data, "Draft failed");
        throw new Error(msg);
      }
      return data as DraftResult;
    });
  }, [run, sessionId]);

  const reset = useCallback(() => {
    setSessionId(null);
    setError(null);
  }, []);

  return {
    sessionId,
    loading,
    error,
    start,
    followup,
    analyze,
    draft,
    reset,
  };
}
