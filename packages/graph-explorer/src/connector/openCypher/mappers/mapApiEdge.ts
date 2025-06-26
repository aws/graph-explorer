import { createEdge, Vertex } from "@/core";
import type { OCEdge } from "../types";
import { mapApiProperties } from "./mapApiProperties";

export default function mapApiEdge(
  apiEdge: OCEdge,
  sourceTypes: Vertex["types"],
  targetTypes: Vertex["types"]
) {
  return createEdge({
    id: apiEdge["~id"],
    type: apiEdge["~type"],
    source: {
      id: apiEdge["~start"],
      types: sourceTypes,
    },
    target: {
      id: apiEdge["~end"],
      types: targetTypes,
    },
    attributes: mapApiProperties(apiEdge["~properties"]),
  });
}
