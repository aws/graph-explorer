import {
  filteredEdgesSelector,
  filteredNodesSelector,
  type EntityRawId,
  type Vertex,
  type VertexId,
} from "@/core";
import type { Branded } from "@/utils";
import { useAtomValue } from "jotai";
import type { Edge, EdgeId } from "../entities/edge";

/** A string representation of a vertex ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedVertexId = Branded<string, "RenderedVertexId">;

/** A string representation of an edge ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedEdgeId = Branded<string, "RenderedEdgeId">;

/** A representation of a vertex that Cytoscape can use. */
export type RenderedVertex = ReturnType<typeof createRenderedVertex>;

/** A representation of an edge that Cytoscape can use. */
export type RenderedEdge = ReturnType<typeof createRenderedEdge>;

/** Returns the filtered array of `RenderedVertex` instances for use by Cytoscape. */
export function useRenderedVertices(): RenderedVertex[] {
  const vertices = useAtomValue(filteredNodesSelector);
  return vertices.values().map(createRenderedVertex).toArray();
}

/** Returns the filtered array of `RenderedEdge` instances for use by Cytoscape. */
export function useRenderedEdges(): RenderedEdge[] {
  const edges = useAtomValue(filteredEdgesSelector);
  return edges.values().map(createRenderedEdge).toArray();
}

export function useRenderedEntities() {
  const vertices = useRenderedVertices();
  const edges = useRenderedEdges();
  return { vertices, edges };
}

/**
 * Maps a rendered edge back to a regular edge.
 * @param renderedEdge The rendered edge
 * @returns An edge instance
 */
export function createEdgeFromRenderedEdge(renderedEdge: RenderedEdge): Edge {
  return {
    ...renderedEdge.data,
    id: getEdgeIdFromRenderedEdgeId(renderedEdge.data.id),
    sourceId: getVertexIdFromRenderedVertexId(renderedEdge.data.source),
    targetId: getVertexIdFromRenderedVertexId(renderedEdge.data.target),
  };
}

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
  id: RenderedVertexId
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

/**
 * Creates a representation of a vertex that Cytoscape can use.
 *
 * Cytoscape expects a few things:
 * - The `id` property is a string
 * - There exists a `data` property where any custom data is stored
 */
function createRenderedVertex(vertex: Vertex) {
  return {
    data: {
      ...vertex,
      id: createRenderedVertexId(vertex.id),
    },
  };
}

/**
 * Creates a representation of an edge that Cytoscape can use.
 *
 * Cytoscape expects a few things:
 * - The `id` property is a string
 * - The `source` and `target` properties are strings
 * - There exists a `data` property where any custom data is stored
 */
function createRenderedEdge(edge: Edge) {
  return {
    data: {
      ...edge,
      id: createRenderedEdgeId(edge.id),
      source: createRenderedVertexId(edge.sourceId),
      target: createRenderedVertexId(edge.targetId),
    },
  };
}
