import { getServerEnv } from "../env";
import type { SimilarPatentRef } from "../invention/types";
import {
  USPTO_DEFAULT_BASE_URL,
  USPTO_PATENT_SEARCH_PATH,
  USPTO_QUERY_MAX_CHARS,
  USPTO_SEARCH_OFFSET,
  USPTO_SEARCH_RESULT_LIMIT,
} from "./constants";

type UnknownRecord = Record<string, unknown>;

function asRecord(v: unknown): UnknownRecord | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as UnknownRecord)
    : null;
}

function pickFromWrapper(item: UnknownRecord): SimilarPatentRef {
  const appNo = item["applicationNumberText"];
  const meta = asRecord(item["applicationMetaData"]);
  const fromMeta =
    meta && typeof meta["inventionTitle"] === "string" ? meta["inventionTitle"] : undefined;
  const topTitle = typeof item["inventionTitle"] === "string" ? item["inventionTitle"] : undefined;
  const title = fromMeta ?? topTitle ?? "Untitled reference";
  const id = typeof appNo === "string" ? appNo : undefined;
  return { title, id };
}

async function readErrorSnippet(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return "";
    return text.slice(0, 280);
  } catch {
    return "";
  }
}

/**
 * USPTO Open Data Portal: POST /api/v1/patent/applications/search with body { q, pagination }.
 * @see https://github.com/patent-dev/uspto-odp (SearchPatents)
 */
export async function searchSimilarPatents(keywords: string): Promise<SimilarPatentRef[]> {
  const env = getServerEnv();
  const key = env.USPTO_API_KEY?.trim();
  if (!key) {
    return [
      {
        title: "Configure USPTO_API_KEY",
        snippet:
          "Set USPTO_API_KEY (and optionally USPTO_API_BASE_URL) to enable live similar-patent search.",
      },
    ];
  }

  const base = (env.USPTO_API_BASE_URL ?? USPTO_DEFAULT_BASE_URL).replace(/\/$/, "");
  const q = keywords.trim().slice(0, USPTO_QUERY_MAX_CHARS);
  const url = `${base}${USPTO_PATENT_SEARCH_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q,
        pagination: {
          offset: USPTO_SEARCH_OFFSET,
          limit: USPTO_SEARCH_RESULT_LIMIT,
        },
      }),
    });

    if (!res.ok) {
      const extra = await readErrorSnippet(res);
      return [
        {
          title: "USPTO search request failed",
          snippet: `HTTP ${res.status}. ${extra || "Check API key and USPTO_API_BASE_URL."}`,
        },
      ];
    }

    const data: unknown = await res.json();
    const root = asRecord(data);
    const bag = root?.["patentFileWrapperDataBag"];
    const items = Array.isArray(bag) ? bag : [];
    const out: SimilarPatentRef[] = [];

    for (const raw of items) {
      const rec = asRecord(raw);
      if (!rec) continue;
      out.push(pickFromWrapper(rec));
    }

    if (out.length === 0) {
      return [{ title: "No similar applications returned", snippet: "Try different keywords." }];
    }
    return out;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return [{ title: "USPTO search error", snippet: msg }];
  }
}
