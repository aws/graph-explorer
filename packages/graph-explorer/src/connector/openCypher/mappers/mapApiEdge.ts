import { createEdgeId, createVertexId, type Edge } from "@/core";
import type { OCEdge } from "../types";

const mapApiEdge = (
  apiEdge: OCEdge,
  sourceType: string,
  targetType: string
): Edge => {
  return {
    entityType: "edge",
    id: createEdgeId(apiEdge["~id"]),
    idType: "string",
    type: apiEdge["~type"],
    source: createVertexId(apiEdge["~start"]),
    sourceType: sourceType,
    target: createVertexId(apiEdge["~end"]),
    targetType: targetType,
    attributes: apiEdge["~properties"] || {},
  };
};

export default mapApiEdge;
