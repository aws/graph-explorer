import { useAtomValue } from "jotai";

import type { Branded } from "@/utils";

import {
  type DisplayEdge,
  type DisplayVertex,
  edgesFilteredIdsAtom,
  edgesTypesFilteredAtom,
  type EntityPropertyValue,
  type EntityRawId,
  getRawId,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  useAllNeighbors,
  useDisplayEdgesInCanvas,
  useDisplayVerticesInCanvas,
  type VertexId,
} from "@/core";
import { RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";

import type { EdgeId } from "../entities/edge";

import {
  CONDITION_MET_DATA_KEY,
  evaluateStyleCondition,
} from "./conditionalStyling";
import {
  edgeStyleAtom,
  type StyleCondition,
  vertexStyleAtom,
} from "./graphStyles";

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
  const filteredIds = useAtomValue(nodesFilteredIdsAtom);
  const filteredTypes = useAtomValue(nodesTypesFilteredAtom);
  const displayVerticesInGraph = useDisplayVerticesInCanvas();
  const neighborCounts = useAllNeighbors();
  const vertexStyles = useAtomValue(vertexStyleAtom);

  const result: RenderedVertex[] = [];

  for (const vertex of displayVerticesInGraph.values()) {
    // Filters the nodes added to the graph by:
    // - Individual nodes hidden using the table view
    // - Vertex types unselected in the filter sidebar
    if (filteredIds.has(vertex.id)) continue;

    // Check if any vertex type is in the filtered types
    let hasFilteredType = false;
    for (const type of vertex.types) {
      if (filteredTypes.has(type)) {
        hasFilteredType = true;
        break;
      }
    }
    if (hasFilteredType) continue;

    const neighborCount = neighborCounts.get(vertex.id)?.unfetched ?? 0;
    const condition = vertexStyles.get(vertex.primaryType).conditionalStyle
      ?.condition;
    result.push(createRenderedVertex(vertex, neighborCount, condition));
  }

  return result;
}

/** Returns the filtered array of `RenderedEdge` instances for use by Cytoscape. */
export function useRenderedEdges(): RenderedEdge[] {
  const edges = useDisplayEdgesInCanvas();
  const filteredEdgeIds = useAtomValue(edgesFilteredIdsAtom);
  const filteredEdgeTypes = useAtomValue(edgesTypesFilteredAtom);
  const vertices = useRenderedVertices();
  const edgeStyles = useAtomValue(edgeStyleAtom);

  // Get the IDs of the existing vertices
  const existingVertexIds = new Set(vertices.map(v => v.data.vertexId));

  const result: RenderedEdge[] = [];

  for (const edge of edges.values()) {
    // Filters the edges added to the graph by:
    // - Edge types unselected in the filter sidebar
    // - Individual edges hidden using the table view
    // - Missing source or target vertex
    if (filteredEdgeTypes.has(edge.type)) continue;
    if (filteredEdgeIds.has(edge.id)) continue;
    if (!existingVertexIds.has(edge.sourceId)) continue;
    if (!existingVertexIds.has(edge.targetId)) continue;

    const condition = edgeStyles.get(edge.type).conditionalStyle?.condition;
    result.push(createRenderedEdge(edge, condition));
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
 *
 * When the vertex type defines a conditional style, the condition is evaluated
 * here and a `conditionMet` flag is stamped so the conditional Cytoscape
 * selector can match the entities that satisfy it.
 */
function createRenderedVertex(
  vertex: DisplayVertex,
  neighborCount: number,
  condition?: StyleCondition,
) {
  return {
    data: {
      id: createRenderedVertexId(vertex.id),
      type: vertex.primaryType,
      vertexId: vertex.id,
      displayName: vertex.displayName,
      displayTypes: vertex.displayTypes,
      neighborCount,
      ...conditionMetData(condition, attribute =>
        resolveVertexAttributeValue(vertex, attribute),
      ),
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
function createRenderedEdge(edge: DisplayEdge, condition?: StyleCondition) {
  return {
    data: {
      id: createRenderedEdgeId(edge.id),
      source: createRenderedVertexId(edge.sourceId),
      target: createRenderedVertexId(edge.targetId),
      edgeId: edge.id,
      type: edge.type,
      displayName: edge.displayName,
      ...conditionMetData(condition, attribute =>
        resolveEdgeAttributeValue(edge, attribute),
      ),
    },
  };
}

/**
 * Stamps the `conditionMet` flag when the entity satisfies the condition, or an
 * empty object otherwise. The comparison runs in JavaScript (see
 * {@link evaluateStyleCondition}) so dates and mixed types compare correctly,
 * rather than delegating to Cytoscape's lexicographic/`parseFloat` operators.
 * The attribute's raw value is resolved by the caller so vertices and edges can
 * each supply it from their own shape.
 */
function conditionMetData(
  condition: StyleCondition | undefined,
  resolveValue: (attribute: string) => EntityPropertyValue | undefined,
): Record<string, string> {
  if (!condition) {
    return {};
  }
  const rawValue = resolveValue(condition.attribute);
  return evaluateStyleCondition(rawValue, condition)
    ? { [CONDITION_MET_DATA_KEY]: "true" }
    : {};
}

function resolveVertexAttributeValue(
  vertex: DisplayVertex,
  attribute: string,
): EntityPropertyValue | undefined {
  if (attribute === RESERVED_ID_PROPERTY) {
    return getRawId(vertex.id);
  }
  if (attribute === RESERVED_TYPES_PROPERTY) {
    return vertex.primaryType;
  }
  return vertex.original.attributes[attribute];
}

function resolveEdgeAttributeValue(
  edge: DisplayEdge,
  attribute: string,
): EntityPropertyValue | undefined {
  if (attribute === RESERVED_ID_PROPERTY) {
    return getRawId(edge.id);
  }
  if (attribute === RESERVED_TYPES_PROPERTY) {
    return edge.type;
  }
  return edge.original.attributes[attribute];
}
