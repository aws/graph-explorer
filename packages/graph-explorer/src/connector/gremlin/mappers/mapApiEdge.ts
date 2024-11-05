import type { Edge, EdgeId, VertexId } from "@/@types/entities";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";
import toStringId from "./toStringId";

const mapApiEdge = (apiEdge: GEdge): Edge => {
  const isFragment = apiEdge["@value"].properties == null;
  return {
    entityType: "edge",
    id: toStringId(apiEdge["@value"].id) as EdgeId,
    type: apiEdge["@value"].label,
    source: toStringId(apiEdge["@value"].outV) as VertexId,
    sourceType: apiEdge["@value"].outVLabel,
    target: toStringId(apiEdge["@value"].inV) as VertexId,
    targetType: apiEdge["@value"].inVLabel,
    attributes: parseEdgePropertiesValues(apiEdge["@value"].properties || {}),
    __isFragment: isFragment,
  };
};

export default mapApiEdge;
