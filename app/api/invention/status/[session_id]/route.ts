import { jsonError, jsonOk } from "@/lib/http/json-route";
import { getInventionStatus } from "@/lib/invention/status";

type RouteCtx = { params: Promise<{ session_id: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  const { session_id: sessionId } = await context.params;
  const id = sessionId?.trim() ?? "";
  if (!id) return jsonError(400, "session_id is required");
  const result = getInventionStatus(id);
  if (!result) return jsonError(404, "session not found");
  return jsonOk(result);
}
