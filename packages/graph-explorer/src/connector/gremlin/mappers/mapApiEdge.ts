import { createResultEdge } from "@/connector/entities";

import type { GEdge } from "../types";

import { extractRawId } from "./extractRawId";
import parseEdgePropertiesValues from "./parseEdgePropertiesValues";

export default function mapApiEdge(apiEdge: GEdge, name?: string) {
  // If the properties are null then the edge is a fragment, which will cause a
  // fetch for the full edge details
  const attributes =
    apiEdge["@value"].properties != null
      ? parseEdgePropertiesValues(apiEdge["@value"].properties)
      : undefined;

  return createResultEdge({
    id: extractRawId(apiEdge["@value"].id),
    name,
    type: apiEdge["@value"].label,
    sourceId: extractRawId(apiEdge["@value"].outV),
    targetId: extractRawId(apiEdge["@value"].inV),
    attributes,
  });
}
