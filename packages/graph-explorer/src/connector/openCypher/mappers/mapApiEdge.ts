import { createEdge } from "@/core";
import type { OCEdge } from "../types";
import { mapApiProperties } from "./mapApiProperties";

export default function mapApiEdge(apiEdge: OCEdge) {
  return createEdge({
    id: apiEdge["~id"],
    type: apiEdge["~type"],
    sourceId: apiEdge["~start"],
    targetId: apiEdge["~end"],
    attributes: mapApiProperties(apiEdge["~properties"]),
  });
}
