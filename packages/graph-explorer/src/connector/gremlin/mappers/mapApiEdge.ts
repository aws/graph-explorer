import type { Edge } from "../../../@types/entities";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";

const mapApiEdge = (apiEdge: GEdge): Edge => {
  return {
    data: {
      id: apiEdge["@value"].id,
      type: apiEdge["@value"].label,
      source: apiEdge["@value"].outV,
      sourceType: apiEdge["@value"].outVLabel,
      target: apiEdge["@value"].inV,
      targetType: apiEdge["@value"].inVLabel,
      attributes: parseEdgePropertiesValues(apiEdge["@value"].properties || {}),
    },
  };
};

export default mapApiEdge;
