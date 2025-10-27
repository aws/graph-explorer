import type {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
} from "../useGEFetchTypes";
import { createEdge, type Edge } from "@/core";
import { parseEdgeId } from "./parseEdgeId";

export function edgeDetails(request: EdgeDetailsRequest): EdgeDetailsResponse {
  // Bail early if request is empty
  if (!request.edgeIds.length) {
    return { edges: [] };
  }

  const parsedEdges = request.edgeIds.map(edgeId => ({
    edgeId,
    ...parseEdgeId(edgeId),
  }));

  // Map the results
  const edges: Edge[] = [];
  for (const { edgeId, predicate, source, target } of parsedEdges) {
    const edge = createEdge({
      id: edgeId,
      type: predicate,
      sourceId: source,
      targetId: target,
      // Ensure this edge is not a fragment since SPARQL edges can not have attributes
      attributes: {},
    });
    edges.push(edge);
  }

  return { edges };
}
