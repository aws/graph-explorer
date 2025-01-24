import { VertexId, EdgeId } from "@/core";

/**
 * Creates a VertexId that is a string prefixed with the ID type.
 * @param id The original database ID
 * @returns A VertexId that is a string prefixed with the ID type
 */
export function createVertexId(id: string | number): VertexId {
  return prefixIdWithType(id) as VertexId;
}

/**
 * Creates an EdgeId that is a string prefixed with the ID type.
 * @param id The original database ID
 * @returns An EdgeId that is a string prefixed with the ID type
 */
export function createEdgeId(id: string | number): EdgeId {
  return prefixIdWithType(id) as EdgeId;
}

/**
 * Strips the ID type prefix from the given ID.
 * @param id The original database ID
 * @returns The original database ID without the ID type prefix
 */
export function getRawId(id: VertexId | EdgeId): string | number {
  if (isIdNumber(id)) {
    return parseInt(stripIdTypePrefix(id));
  }
  if (isIdString(id)) {
    return stripIdTypePrefix(id);
  }
  return id;
}

const ID_TYPE_NUM_PREFIX = "(num)";
const ID_TYPE_STR_PREFIX = "(str)";

function prefixIdWithType(id: string | number): string {
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
