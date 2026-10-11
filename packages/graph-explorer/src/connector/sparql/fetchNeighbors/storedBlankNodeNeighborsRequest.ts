import type { NeighborsResponse } from "@/connector/useGEFetchTypes";

import type { BlankNodesMap, SPARQLNeighborsRequest } from "../types";

/**
 * This mock request takes into account the request filtering
 * to narrow the neighbors results of the given blank node.
 */
export const storedBlankNodeNeighborsRequest = (
  blankNodes: BlankNodesMap,
  req: SPARQLNeighborsRequest,
) => {
  return new Promise<NeighborsResponse>(resolve => {
    const bNode = blankNodes.get(req.resourceURI);
    if (!bNode?.neighbors) {
      resolve({ vertices: [], edges: [] });
      return;
    }

    const filteredVertices = bNode.neighbors.vertices.filter(vertex => {
      if (
        req.subjectClasses?.length &&
        !req.subjectClasses.includes(vertex.type)
      ) {
        return false;
      }

      for (const filter of req.attributeFilters ?? []) {
        const attrVal = vertex.attributes[filter.name];
        if (attrVal == null) {
          return false;
        }
        if (
          !String(attrVal).toLowerCase().includes(filter.value.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });

    resolve({
      vertices: filteredVertices.slice(0, req.limit ?? undefined),
      edges: bNode.neighbors.edges,
    });
  });
};
