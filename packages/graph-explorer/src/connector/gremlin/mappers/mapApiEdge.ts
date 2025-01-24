import { createEdgeId, createVertexId, type Edge } from "@/core";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";

import { detectIdType } from "./detectIdType";
import { extractRawId } from "./extractRawId";

const mapApiEdge = (apiEdge: GEdge): Edge => {
  const isFragment = apiEdge["@value"].properties == null;
  return {
    entityType: "edge",
    id: createEdgeId(extractRawId(apiEdge["@value"].id)),
    idType: detectIdType(apiEdge["@value"].id),
    type: apiEdge["@value"].label,
    source: createVertexId(extractRawId(apiEdge["@value"].outV)),
    sourceType: apiEdge["@value"].outVLabel,
    target: createVertexId(extractRawId(apiEdge["@value"].inV)),
    targetType: apiEdge["@value"].inVLabel,
    attributes: parseEdgePropertiesValues(apiEdge["@value"].properties || {}),
    __isFragment: isFragment,
  };
};

export default mapApiEdge;
