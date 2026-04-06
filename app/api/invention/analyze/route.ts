import { jsonError, jsonOk, parseJsonBody } from "@/lib/http/json-route";
import { analyzeInvention } from "@/lib/invention/analyze";
import { sessionIdBodySchema } from "@/lib/invention/schemas";
import type { AnalyzeResult } from "@/lib/invention/types";

export async function POST(request: Request) {
  const raw = await parseJsonBody(request);
  const parsed = sessionIdBodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "session_id is required");
  }
  const result = await analyzeInvention(parsed.data.session_id);
  if (!result) return jsonError(404, "session not found");
  return jsonOk<AnalyzeResult>(result);
}
