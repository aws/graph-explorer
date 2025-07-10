import { OCVertex } from "@/connector/openCypher/types";
import { Vertex } from "@/core";

export function mapToOcVertex(vertex: Vertex): OCVertex {
  return {
    "~entityType": "node",
    "~id": String(vertex.id),
    "~labels": vertex.types,
    "~properties": vertex.attributes,
  };
}
