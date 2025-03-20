import {
  NeighborsResponse,
  toMappedQueryResults,
} from "@/connector/useGEFetchTypes";
import { BlankNodesMap, SPARQLNeighborsRequest } from "../types";

/**
 * This mock request takes into account the request filtering
 * to narrow the neighbors results of the given blank node.
 */
export const storedBlankNodeNeighborsRequest = (
  blankNodes: BlankNodesMap,
  req: SPARQLNeighborsRequest
) => {
  return new Promise<NeighborsResponse>(resolve => {
    const bNode = blankNodes.get(req.resourceURI);
    if (!bNode?.neighbors) {
      resolve(toMappedQueryResults({}));
      return;
    }

    const filteredVertices = bNode.neighbors.vertices.filter(vertex => {
      if (!req.subjectClasses && !req.filterCriteria?.length) {
        return true;
      }

      if (!req.subjectClasses?.includes(vertex.type)) {
        return false;
      }

      if (!req.filterCriteria?.length) {
        return true;
      }

      for (const criterion of req.filterCriteria) {
        const attrVal = vertex.attributes[criterion.predicate];
        if (attrVal == null) {
          return false;
        }
        if (!String(attrVal).match(new RegExp(criterion.object, "gi"))) {
          return false;
        }
      }

      return true;
    });

    resolve(
      toMappedQueryResults({
        vertices: filteredVertices.slice(
          req.offset ?? 0,
          req.limit ? req.limit + (req.offset ?? 0) : undefined
        ),
        edges: bNode.neighbors.edges,
      })
    );
  });
};
