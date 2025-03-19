import { createEdgeId, createVertexId, type Edge } from "@/core";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";

import { extractRawId } from "./extractRawId";

const mapApiEdge = (apiEdge: GEdge): Edge => {
  const isFragment = apiEdge["@value"].properties == null;

  // Since Gremlin does not natively support multi-label nodes, we need to
  // extract the individual labels by splitting the string
  const outVLabels = apiEdge["@value"].outVLabel.split("::");
  const inVLabels = apiEdge["@value"].inVLabel.split("::");

  return {
    entityType: "edge",
    id: createEdgeId(extractRawId(apiEdge["@value"].id)),
    type: apiEdge["@value"].label,
    source: createVertexId(extractRawId(apiEdge["@value"].outV)),
    sourceTypes: outVLabels,
    target: createVertexId(extractRawId(apiEdge["@value"].inV)),
    targetTypes: inVLabels,
    attributes: parseEdgePropertiesValues(apiEdge["@value"].properties || {}),
    __isFragment: isFragment,
  };
};

export default mapApiEdge;
