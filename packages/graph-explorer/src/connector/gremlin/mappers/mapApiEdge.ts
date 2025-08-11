import { createEdge } from "@/core";
import type { GEdge } from "../types";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";

import { extractRawId } from "./extractRawId";

export default function mapApiEdge(apiEdge: GEdge) {
  // If the properties are null then the edge is a fragment, which will cause a
  // fetch for the full edge details
  const attributes =
    apiEdge["@value"].properties != null
      ? parseEdgePropertiesValues(apiEdge["@value"].properties)
      : undefined;

  return createEdge({
    id: extractRawId(apiEdge["@value"].id),
    type: apiEdge["@value"].label,
    source: extractRawId(apiEdge["@value"].outV),
    target: extractRawId(apiEdge["@value"].inV),
    attributes,
  });
}
