import { createEdge } from "@/core";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";

import { extractRawId } from "./extractRawId";

export default function mapApiEdge(apiEdge: GEdge) {
  // Since Gremlin does not natively support multi-label nodes, we need to
  // extract the individual labels by splitting the string
  const outVLabels = apiEdge["@value"].outVLabel.split("::");
  const inVLabels = apiEdge["@value"].inVLabel.split("::");

  // If the properties are null then the edge is a fragment, which will cause a
  // fetch for the full edge details
  const attributes =
    apiEdge["@value"].properties != null
      ? parseEdgePropertiesValues(apiEdge["@value"].properties)
      : undefined;

  return createEdge({
    id: extractRawId(apiEdge["@value"].id),
    type: apiEdge["@value"].label,
    source: {
      id: extractRawId(apiEdge["@value"].outV),
      types: outVLabels,
    },
    target: {
      id: extractRawId(apiEdge["@value"].inV),
      types: inVLabels,
    },
    attributes,
  });
}
