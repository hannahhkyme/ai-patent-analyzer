import { jsonError, jsonOk, parseJsonBody } from "@/lib/http/json-route";
import { followupBodySchema } from "@/lib/invention/schemas";
import { processFollowup } from "@/lib/invention/followup";

export async function POST(request: Request) {
  const raw = await parseJsonBody(request);
  const parsed = followupBodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "session_id and answer are required");
  }
  const result = await processFollowup(parsed.data.session_id, parsed.data.answer);
  if (!result) return jsonError(404, "session not found");
  return jsonOk(result);
}
