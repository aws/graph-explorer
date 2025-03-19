import { createEdgeId, createVertexId, Vertex, type Edge } from "@/core";
import type { OCEdge } from "../types";

const mapApiEdge = (
  apiEdge: OCEdge,
  sourceTypes: Vertex["types"],
  targetTypes: Vertex["types"]
): Edge => {
  return {
    entityType: "edge",
    id: createEdgeId(apiEdge["~id"]),
    type: apiEdge["~type"],
    source: createVertexId(apiEdge["~start"]),
    sourceTypes: sourceTypes,
    target: createVertexId(apiEdge["~end"]),
    targetTypes: targetTypes,
    attributes: apiEdge["~properties"] || {},
  };
};

export default mapApiEdge;
