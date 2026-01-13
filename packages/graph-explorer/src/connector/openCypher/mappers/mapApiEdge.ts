import { createResultEdge } from "@/connector/entities";

import type { OCEdge } from "../types";

import { mapApiProperties } from "./mapApiProperties";

export default function mapApiEdge(apiEdge: OCEdge, name?: string) {
  return createResultEdge({
    id: apiEdge["~id"],
    name,
    type: apiEdge["~type"],
    sourceId: apiEdge["~start"],
    targetId: apiEdge["~end"],
    attributes: mapApiProperties(apiEdge["~properties"]),
  });
}
