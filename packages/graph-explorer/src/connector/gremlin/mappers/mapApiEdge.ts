import type { Edge } from "../../../@types/entities";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";
import toStringId from "./toStringId";

const mapApiEdge = (apiEdge: GEdge): Edge => {
  return {
    data: {
      id: toStringId(apiEdge["@value"].id),
      type: apiEdge["@value"].label,
      source: toStringId(apiEdge["@value"].outV),
      sourceType: apiEdge["@value"].outVLabel,
      target: toStringId(apiEdge["@value"].inV),
      targetType: apiEdge["@value"].inVLabel,
      attributes: parseEdgePropertiesValues(apiEdge["@value"].properties || {}),
    },
  };
};

export default mapApiEdge;
