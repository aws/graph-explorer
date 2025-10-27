import { logger } from "@/utils";
import type { KeywordSearchResponse } from "@/connector";
import keywordSearchTemplate from "./keywordSearchTemplate";
import type { SparqlFetch, SPARQLKeywordSearchRequest } from "../types";
import { createVertex } from "@/core";
import { parseAndMapQuads } from "../parseAndMapQuads";

async function keywordSearch(
  sparqlFetch: SparqlFetch,
  req: SPARQLKeywordSearchRequest
): Promise<KeywordSearchResponse> {
  const template = keywordSearchTemplate(req);

  // Fetch the results
  logger.log("[SPARQL Explorer] Fetching search results...", req);
  const data = await sparqlFetch(template);

  // Map to fully materialized entities
  const results = parseAndMapQuads(data);
  const vertices = results.vertices.map(v => createVertex(v));

  return { vertices };
}

export default keywordSearch;
