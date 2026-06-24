import type { EntityProperties, EntityPropertyValue, VertexId } from "@/core";

import { RESERVED_ID_PROPERTY } from "@/utils/constants";

import { idParam } from "./idParam";

export type UpdateVertexPropertiesRequest = {
  vertexId: VertexId;
  properties: EntityProperties;
};

function escapeString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function valueParam(value: EntityPropertyValue): string {
  if (typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return `new Date(${String(value.getTime())}L)`;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? `${String(value)}L` : String(value);
  }
  return `"${escapeString(value)}"`;
}

/**
 * Builds a Gremlin traversal that overwrites a set of properties on a vertex.
 *
 * Each property step uses plain `.property(key, value)`, which replaces the
 * existing value for single-cardinality properties as defined in the JanusGraph
 * schema. The `~id` system property is always excluded even if present in the
 * request. The traversal ends at the updated vertex so the caller can refresh
 * the local cache without a re-query.
 */
export function updateVertexPropertiesQuery({
  vertexId,
  properties,
}: UpdateVertexPropertiesRequest): string {
  const propertySteps = Object.entries(properties)
    .filter(([key]) => key !== RESERVED_ID_PROPERTY)
    .map(
      ([key, value]) =>
        `.property("${escapeString(key)}", ${valueParam(value)})`,
    )
    .join("");

  return `g.V(${idParam(vertexId)})${propertySteps}`;
}
