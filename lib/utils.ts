export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function extractErrorMessage(data: unknown, fallback: string): string {
  return isRecord(data) && typeof data.message === "string" ? data.message : fallback;
}
