import type {
  KeywordSearchRequest,
  KeywordSearchResponse,
} from "@/connector/useGEFetchTypes";

import { logger } from "@/utils";

import type { BlankNodesMap } from "../types";

import keywordSearchBlankNodesIdsTemplate from "./keywordSearchBlankNodesIdsTemplate";

export const replaceBlankNodeFromSearch = (
  blankNodes: BlankNodesMap,
  request: KeywordSearchRequest,
  response: KeywordSearchResponse,
) => {
  logger.log(
    "[SPARQL Explorer] Replacing blank node from search with keywordSearchBlankNodesIdsTemplate",
  );
  return response.vertices.map(vertex => {
    if (!vertex.isBlankNode) {
      return vertex;
    }

    const bNode = blankNodes.get(vertex.id);

    if (!bNode) {
      blankNodes.set(vertex.id, {
        id: vertex.id,
        subQueryTemplate: keywordSearchBlankNodesIdsTemplate(request),
        vertex,
        neighborCounts: {
          totalCount: 0,
          counts: new Map(),
        },
      });
    }

    return bNode?.vertex ?? vertex;
  });
};
