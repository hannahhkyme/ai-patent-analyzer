import OpenAI from "openai";
import { getServerEnv } from "../env";

export function getOpenAIClient(): OpenAI | null {
  const key = getServerEnv().OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}
