import { atom, useAtomValue } from "jotai";

import type { Branded } from "@/utils";

import {
  type DisplayEdge,
  type DisplayVertex,
  displayVerticesInCanvasSelector,
  type EdgeType,
  edgesFilteredIdsAtom,
  edgeStyleAtom,
  edgesTypesFilteredAtom,
  type EntityRawId,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  useAllNeighbors,
  useDisplayEdgesInCanvas,
  type VertexId,
  type VertexStyle,
  vertexStyleAtom,
  type VertexType,
} from "@/core";

import type { EdgeId } from "../entities/edge";

import {
  type EdgeStyleData,
  edgeStyleData,
  type VertexStyleData,
} from "./graphElementStyleData";
import { useVertexStyleDataByType } from "./styleDataResolvers";

/** A string representation of a vertex ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedVertexId = Branded<string, "RenderedVertexId">;

/** A string representation of an edge ID that encodes the original type. Cytoscape requires IDs to be strings. */
export type RenderedEdgeId = Branded<string, "RenderedEdgeId">;

/** A representation of a vertex that Cytoscape can use. */
export type RenderedVertex = ReturnType<typeof createRenderedVertex>;

/** A representation of an edge that Cytoscape can use. */
export type RenderedEdge = ReturnType<typeof createRenderedEdge>;

/**
 * The canvas vertices that survive filtering, in canvas insertion order, plus
 * their IDs for membership tests and the styles of the types they draw.
 *
 * One loop, so the style scope and the drawn set cannot disagree: a drawn
 * vertex's `primaryType` is in `stylesByType` by construction. The schema can
 * carry tens of thousands of vertex types while the canvas shows a handful, and
 * resolving a style plus an icon for every type in the schema on every render is
 * the dominant render cost otherwise. The schema view, which genuinely draws
 * every type, uses `useAllVertexStyles` instead.
 *
 * An atom rather than a hook so both the vertex and edge pipelines share one
 * computation per store — as a hook it ran once per call site.
 *
 * Note this still recomputes when a vertex style changes, because
 * `displayVerticesInCanvasSelector` resolves display labels through
 * `vertexStyleByTypeAtom`.
 */
export const canvasVerticesAtom = atom(get => {
  const filteredIds = get(nodesFilteredIdsAtom);
  const filteredTypes = get(nodesTypesFilteredAtom);
  const displayVertices = get(displayVerticesInCanvasSelector);
  const styles = get(vertexStyleAtom);

  const vertices: DisplayVertex[] = [];
  const ids = new Set<VertexId>();
  const stylesByType = new Map<VertexType, VertexStyle>();

  for (const vertex of displayVertices.values()) {
    // Filters the nodes added to the graph by:
    // - Individual nodes hidden using the table view
    // - Vertex types unselected in the filter sidebar
    if (filteredIds.has(vertex.id)) continue;
    if (vertex.types.some(type => filteredTypes.has(type))) continue;

    vertices.push(vertex);
    ids.add(vertex.id);
    if (!stylesByType.has(vertex.primaryType)) {
      stylesByType.set(vertex.primaryType, styles.get(vertex.primaryType));
    }
  }

  return { vertices, ids, stylesByType };
});

/** Returns the filtered array of `RenderedVertex` instances for use by Cytoscape. */
export function useRenderedVertices(): RenderedVertex[] {
  const { vertices, stylesByType } = useAtomValue(canvasVerticesAtom);
  const neighborCounts = useAllNeighbors();
  const styleDataByType = useVertexStyleDataByType(stylesByType.values());

  const result: RenderedVertex[] = [];

  for (const vertex of vertices) {
    const styleData = styleDataByType.get(vertex.primaryType);
    // `canvasVerticesAtom` scopes the styles to the types it drew.
    if (styleData === undefined) {
      throw new Error(
        `No style data resolved for drawn vertex type "${vertex.primaryType}"`,
      );
    }

    const neighborCount = neighborCounts.get(vertex.id)?.unfetched ?? 0;
    result.push(createRenderedVertex(vertex, neighborCount, styleData));
  }

  return result;
}

/** Returns the filtered array of `RenderedEdge` instances for use by Cytoscape. */
export function useRenderedEdges(): RenderedEdge[] {
  const edges = useDisplayEdgesInCanvas();
  const filteredEdgeIds = useAtomValue(edgesFilteredIdsAtom);
  const filteredEdgeTypes = useAtomValue(edgesTypesFilteredAtom);
  const { ids: visibleVertexIds } = useAtomValue(canvasVerticesAtom);
  const styles = useAtomValue(edgeStyleAtom);

  // The drawn edge types are only known while filtering, so style data is
  // resolved on first sight of a type — one `Color` parse per type, not per edge.
  const styleDataByType = new Map<EdgeType, EdgeStyleData>();
  const result: RenderedEdge[] = [];

  for (const edge of edges.values()) {
    // Filters the edges added to the graph by:
    // - Edge types unselected in the filter sidebar
    // - Individual edges hidden using the table view
    // - Missing source or target vertex
    if (filteredEdgeTypes.has(edge.type)) continue;
    if (filteredEdgeIds.has(edge.id)) continue;
    if (!visibleVertexIds.has(edge.sourceId)) continue;
    if (!visibleVertexIds.has(edge.targetId)) continue;

    let styleData = styleDataByType.get(edge.type);
    if (styleData === undefined) {
      styleData = edgeStyleData(styles.get(edge.type));
      styleDataByType.set(edge.type, styleData);
    }

    result.push(createRenderedEdge(edge, styleData));
  }

  return result;
}

export function useRenderedEntities() {
  const vertices = useRenderedVertices();
  const edges = useRenderedEdges();
  return { vertices, edges };
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

/**
 * Creates a representation of a vertex that Cytoscape can use.
 *
 * Cytoscape expects a few things:
 * - The `id` property is a string
 * - There exists a `data` property where any custom data is stored
 */
function createRenderedVertex(
  vertex: DisplayVertex,
  neighborCount: number,
  styleData: VertexStyleData,
) {
  return {
    data: {
      id: createRenderedVertexId(vertex.id),
      type: vertex.primaryType,
      vertexId: vertex.id,
      displayName: vertex.displayName,
      displayTypes: vertex.displayTypes,
      neighborCount,
      ...styleData,
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
function createRenderedEdge(edge: DisplayEdge, styleData: EdgeStyleData) {
  return {
    data: {
      id: createRenderedEdgeId(edge.id),
      source: createRenderedVertexId(edge.sourceId),
      target: createRenderedVertexId(edge.targetId),
      edgeId: edge.id,
      type: edge.type,
      displayName: edge.displayName,
      ...styleData,
    },
  };
}
