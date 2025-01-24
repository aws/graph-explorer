import type { Edge, EdgeId, VertexId } from "@/core";
import type { OCEdge } from "../types";

const mapApiEdge = (
  apiEdge: OCEdge,
  sourceType: string,
  targetType: string
): Edge => {
  return {
    entityType: "edge",
    id: apiEdge["~id"] as EdgeId,
    idType: "string",
    type: apiEdge["~type"],
    source: apiEdge["~start"] as VertexId,
    sourceType: sourceType,
    target: apiEdge["~end"] as VertexId,
    targetType: targetType,
    attributes: apiEdge["~properties"] || {},
  };
};

export default mapApiEdge;
