/**
 * The string encoding Cytoscape requires for element IDs. The prefix records
 * whether the original ID was a number or a string so the raw ID can be
 * round-tripped back out of the rendered ID.
 */

import type { Branded } from "@/utils";

import type { EdgeId } from "../entities/edge";
import type { EntityRawId } from "../entities/shared";
import type { VertexId } from "../entities/vertex";

/** A string representation of a vertex ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedVertexId = Branded<string, "RenderedVertexId">;

/** A string representation of an edge ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedEdgeId = Branded<string, "RenderedEdgeId">;

/** Maps a VertexId to a string with the original type prefixed. */
export function createRenderedVertexId(id: VertexId): RenderedVertexId {
  return prefixIdWithType(id) as RenderedVertexId;
}

/** Maps an EdgeId to a string with the original type prefixed. */
export function createRenderedEdgeId(id: EdgeId): RenderedEdgeId {
  return prefixIdWithType(id) as RenderedEdgeId;
}

/** Strips the ID type prefix from the given ID and returns the value as a VertexId. */
export function getVertexIdFromRenderedVertexId(
  id: RenderedVertexId,
): VertexId {
  if (isIdNumber(id)) {
    return parseInt(stripIdTypePrefix(id)) as VertexId;
  }
  if (isIdString(id)) {
    return stripIdTypePrefix(id) as VertexId;
  }
  return String(id) as VertexId;
}

/** Strips the ID type prefix from the given ID and returns the value as an EdgeId. */
export function getEdgeIdFromRenderedEdgeId(id: RenderedEdgeId): EdgeId {
  if (isIdNumber(id)) {
    return parseInt(stripIdTypePrefix(id)) as EdgeId;
  }
  if (isIdString(id)) {
    return stripIdTypePrefix(id) as EdgeId;
  }
  return String(id) as EdgeId;
}

const ID_TYPE_NUM_PREFIX = "(num)";
const ID_TYPE_STR_PREFIX = "(str)";

function prefixIdWithType(id: EntityRawId): string {
  if (typeof id === "number") {
    return `${ID_TYPE_NUM_PREFIX}${id}`;
  }

  return `${ID_TYPE_STR_PREFIX}${id}`;
}

function isIdNumber(id: string): boolean {
  return id.startsWith(ID_TYPE_NUM_PREFIX);
}

function isIdString(id: string): boolean {
  return id.startsWith(ID_TYPE_STR_PREFIX);
}

function stripIdTypePrefix(id: string): string {
  if (isIdNumber(id)) {
    return id.slice(ID_TYPE_NUM_PREFIX.length);
  }
  if (isIdString(id)) {
    return id.slice(ID_TYPE_STR_PREFIX.length);
  }
  return id;
}
