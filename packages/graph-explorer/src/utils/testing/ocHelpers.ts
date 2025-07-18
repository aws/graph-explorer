import { OCEdge, OCVertex } from "@/connector/openCypher/types";
import { Edge, Vertex } from "@/core";

export function mapToOcVertex(vertex: Vertex): OCVertex {
  return {
    "~entityType": "node",
    "~id": String(vertex.id),
    "~labels": vertex.types,
    "~properties": vertex.attributes,
  };
}

export function mapToOcEdge(edge: Edge): OCEdge {
  return {
    "~entityType": "relationship",
    "~id": String(edge.id),
    "~type": edge.type,
    "~start": String(edge.source),
    "~end": String(edge.target),
    "~properties": edge.attributes,
  };
}
