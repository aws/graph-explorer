import { KeywordSearchResponse } from "@/connector/useGEFetchTypes";
import { BlankNodesMap, SPARQLNeighborsRequest } from "../types";
import { logger } from "@/utils";
import oneHopNeighborsBlankNodesIdsTemplate from "./oneHopNeighborsBlankNodesIdsTemplate";

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
