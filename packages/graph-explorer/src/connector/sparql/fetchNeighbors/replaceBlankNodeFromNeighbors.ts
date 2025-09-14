import { type BlankNodesMap, type SPARQLNeighborsRequest } from "../types";
import oneHopNeighborsBlankNodesIdsTemplate from "./oneHopNeighborsBlankNodesIdsTemplate";
import { type KeywordSearchResponse } from "@/connector/useGEFetchTypes";
import { logger } from "@/utils";

export const replaceBlankNodeFromNeighbors = (
  blankNodes: BlankNodesMap,
  request: SPARQLNeighborsRequest,
  response: KeywordSearchResponse
) => {
  logger.log(
    "[SPARQL Explorer] Replacing blank node from search with oneHopNeighborsBlankNodesIdsTemplate"
  );
  return response.vertices.map(vertex => {
    if (!vertex.isBlankNode) {
      return vertex;
    }

    const bNode = blankNodes.get(vertex.id);
    if (!bNode?.neighbors) {
      blankNodes.set(vertex.id, {
        id: vertex.id,
        subQueryTemplate: oneHopNeighborsBlankNodesIdsTemplate(request),
        vertex,
        neighborCounts: {
          totalCount: 0,
          counts: {},
        },
      });
    }

    return bNode?.vertex ?? vertex;
  });
};
