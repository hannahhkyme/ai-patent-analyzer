"use client";

import { useCallback, useState } from "react";
import { isRecord, extractErrorMessage } from "@/lib/utils";

type UploadResult = { text: string };

export function usePdfUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg = extractErrorMessage(data, "Upload failed");
        throw new Error(msg);
      }
      if (!isRecord(data) || typeof data.text !== "string") {
        throw new Error("Invalid upload response");
      }
      return { text: data.text };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, loading, error };
}
