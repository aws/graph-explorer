import type { Vertex, VertexId } from "@/core";
import type { OCVertex } from "../types";

export default function mapApiVertex(apiVertex: OCVertex): Vertex {
  const labels = apiVertex["~labels"];
  const vt = labels[0] ?? "";

  return {
    entityType: "vertex",
    id: apiVertex["~id"] as VertexId,
    idType: "string",
    type: vt,
    types: labels,
    attributes: apiVertex["~properties"],
  };
}
