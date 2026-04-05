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

/** ODP search index uses nested fields; bare `inventionTitle:` matches nothing. */
function normalizeUsptoQ(raw: string): string {
  return raw.replace(/\binventionTitle:/g, "applicationMetaData.inventionTitle:");
}

/** User-facing row for non-empty-result failures (details logged separately). */
function friendlyUsptoHttpFailure(status: number): SimilarPatentRef {
  switch (status) {
    case 401:
    case 403:
      return {
        title: "Similar patent search unavailable",
        snippet:
          "The USPTO API did not authorize this request. Check that USPTO_API_KEY is valid and has access to the Open Data Portal.",
      };
    case 429:
      return {
        title: "Similar patent search rate limited",
        snippet: "The USPTO service is limiting requests. Wait a few minutes and run analysis again.",
      };
    case 502:
    case 503:
    case 504:
      return {
        title: "USPTO service unavailable",
        snippet: "The USPTO data service returned an error or timed out. Try again in a little while.",
      };
    case 400:
      return {
        title: "Similar patent search could not run",
        snippet: "The search request was not accepted. If this keeps happening, try again with a shorter disclosure or title.",
      };
    default:
      return {
        title: "Similar patent search unavailable",
        snippet:
          "We couldn’t retrieve similar applications from the USPTO right now. The rest of your analysis still applies—try again later.",
      };
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
        title: "Similar patent search not configured",
        snippet:
          "Add USPTO_API_KEY on the server to search for similar published applications. Other analysis still works without it.",
      },
    ];
  }

  const base = (env.USPTO_API_BASE_URL ?? USPTO_DEFAULT_BASE_URL).replace(/\/$/, "");
  const q = normalizeUsptoQ(keywords.trim()).slice(0, USPTO_QUERY_MAX_CHARS);
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
      const text = await res.text();
      if (res.status === 404 && /no matching records/i.test(text)) {
        return [{ title: "No similar applications returned", snippet: "Try different keywords." }];
      }
      console.warn(
        "USPTO search HTTP error",
        res.status,
        text ? text.slice(0, 500) : "(empty body)",
      );
      return [friendlyUsptoHttpFailure(res.status)];
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
    console.error("USPTO search request failed:", msg);
    return [
      {
        title: "Similar patent search unavailable",
        snippet: "We couldn’t reach the USPTO service. Check your network connection and try again.",
      },
    ];
  }
}
