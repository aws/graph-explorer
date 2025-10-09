import { type EdgeId } from "./edge";
import { type EntityRawId } from "./shared";
import { type VertexId } from "./vertex";

/**
 * Creates a VertexId from the given database ID.
 * @param id The original database ID
 */
export function createVertexId(id: EntityRawId): VertexId {
  return id as VertexId;
}

/**
 * Creates an EdgeId from the given database ID.
 * @param id The original database ID
 */
export function createEdgeId(id: EntityRawId): EdgeId {
  return id as EdgeId;
}

/**
 * Strips the ID type prefix from the given ID.
 * @param id The original database ID
 * @returns The original database ID without the ID type prefix
 */
export function getRawId(id: VertexId | EdgeId): EntityRawId {
  return id;
}
