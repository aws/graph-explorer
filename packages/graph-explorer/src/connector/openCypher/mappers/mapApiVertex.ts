import { createVertexId, type Vertex } from "@/core";
import type { OCVertex } from "../types";

export default function mapApiVertex(apiVertex: OCVertex): Vertex {
  const labels = apiVertex["~labels"];

  // Check for empty labels, which is possible with some databases
  const vt = labels[0] ?? "";

  return {
    entityType: "vertex",
    id: createVertexId(apiVertex["~id"]),
    type: vt,
    types: labels,
    attributes: apiVertex["~properties"],
  };
}
