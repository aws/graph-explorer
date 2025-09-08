import {
  type ResultVertex,
  type ResultEdge,
  type ScalarValue,
  createTypedValue,
} from "@/connector/entities";
import type { OCEdge, OCVertex } from "@/connector/openCypher/types";
import { getRawId } from "@/core";

export function mapToOcVertex(vertex: ResultVertex): OCVertex {
  const id = getRawId(vertex.id);

  if (typeof id !== "string") {
    throw new Error("Vertex id is not valid");
  }

  return {
    "~id": id,
    "~entityType": "node",
    "~labels": vertex.types,
    // Can't be a fragment in openCypher
    "~properties": vertex.attributes ?? {},
  };
}

export function mapToOcEdge(edge: ResultEdge): OCEdge {
  const id = getRawId(edge.id);
  const sourceId = getRawId(edge.sourceId);
  const targetId = getRawId(edge.targetId);

  if (typeof id !== "string") {
    throw new Error("Edge id is not valid");
  }
  if (typeof sourceId !== "string") {
    throw new Error("Edge source is not valid");
  }
  if (typeof targetId !== "string") {
    throw new Error("Edge target is not valid");
  }

  return {
    "~id": id,
    "~entityType": "relationship",
    "~type": edge.type,
    "~start": sourceId,
    "~end": targetId,
    // openCypher does not have fragments
    "~properties": edge.attributes ?? {},
  };
}

export function mapToOcScalar(value: ScalarValue) {
  const typedValue = createTypedValue(value);

  if (typedValue.type === "date") {
    return typedValue.value.toISOString();
  } else {
    return typedValue.value;
  }
}
