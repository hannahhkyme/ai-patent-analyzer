import { jsonError, jsonOk, parseJsonBody } from "@/lib/http/json-route";
import { startInvention } from "@/lib/invention/start";
import { startBodySchema } from "@/lib/invention/schemas";

export async function POST(request: Request) {
  const raw = await parseJsonBody(request);
  const parsed = startBodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "title and description are required");
  }
  const result = await startInvention(parsed.data.title, parsed.data.description);
  return jsonOk(result);
}
