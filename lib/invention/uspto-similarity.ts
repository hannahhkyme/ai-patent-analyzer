import { generateUsptoSearchQuery } from "../openai/uspto-search-query";
import { getOpenAIClient } from "../openai/client";
import {
  buildHeuristicUsptoQuery,
  buildTitleOnlyUsptoQuery,
  isUsptoEmptyResultsPlaceholder,
} from "../uspto/build-search-query";
import { searchSimilarPatents } from "../uspto/patent-search";
import type { InventionSession } from "./types";
import type { SimilarPatentRef } from "./types";

export async function runPatentSimilaritySearch(session: InventionSession): Promise<{
  similar_patents: SimilarPatentRef[];
  uspto_search_query?: string;
}> {
  const client = getOpenAIClient();
  let primary =
    client != null
      ? await generateUsptoSearchQuery(client, {
          title: session.title,
          description: session.description,
          answers: session.answers,
        })
      : null;

  if (primary == null || primary.length < 3) {
    primary = buildHeuristicUsptoQuery(session.title, session.description);
  }

  let similar = await searchSimilarPatents(primary);
  let queryNote = primary;

  if (isUsptoEmptyResultsPlaceholder(similar)) {
    const fallback = buildTitleOnlyUsptoQuery(session.title);
    if (fallback.length >= 3 && fallback !== primary) {
      similar = await searchSimilarPatents(fallback);
      queryNote = `${primary} (retry: ${fallback})`;
    }
  }

  return { similar_patents: similar, uspto_search_query: queryNote };
}
