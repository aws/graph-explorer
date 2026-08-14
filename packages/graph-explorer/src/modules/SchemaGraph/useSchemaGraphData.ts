import { useAtomValue } from "jotai";

import type { GraphEdge, GraphNode } from "@/components/Graph";

import {
  createEdgeConnectionId,
  type EdgeConnectionId,
  type EdgeStyleData,
  edgeStyleAtom,
  edgeStyleData,
  type EdgeType,
  useActiveSchema,
  useDisplayEdgeTypeConfigs,
  useDisplayVertexTypeConfigs,
  useVertexStyleDataByType,
  vertexStyleAtom,
  type VertexStyleData,
  type VertexType,
} from "@/core";

type SchemaGraphNode = GraphNode & {
  data: {
    id: VertexType;
    type: VertexType;
    displayLabel: string;
  } & VertexStyleData;
};

type SchemaGraphEdge = GraphEdge & {
  data: {
    id: EdgeConnectionId;
    source: VertexType;
    target: VertexType;
    type: EdgeType;
    displayLabel: string;
  } & EdgeStyleData;
};

/**
 * Transforms schema vertex types and edge connections into graph visualization data.
 * Filters out edges where source or target nodes don't exist in the schema.
 *
 * @returns Object containing nodes (vertex types) and edges (edge connections) for rendering
 */
export function useSchemaGraphData() {
  const nodes = useSchemaGraphNodes();
  const existingNodeIds = new Set(nodes.map(n => n.data.id));
  const edges = useSchemaGraphEdges(existingNodeIds);
  return { nodes, edges };
}

/**
 * Transforms vertex type configs into schema graph nodes.
 *
 * The style scope is derived from the same type configs the loop iterates, so
 * the drawn set and the styled set are the same set. Scoping it from the schema
 * instead would not be equivalent: `useActiveSchema` is deferred while the type
 * configs read the schema atom directly, so mid-sync a render could see a type
 * in the configs whose style had not arrived yet.
 */
function useSchemaGraphNodes(): SchemaGraphNode[] {
  const vtConfigs = useDisplayVertexTypeConfigs();
  const styles = useAtomValue(vertexStyleAtom);
  const styleDataByType = useVertexStyleDataByType(
    vtConfigs.values().map(config => styles.get(config.type)),
  );

  const nodes: SchemaGraphNode[] = [];

  for (const [type, styleData] of styleDataByType) {
    nodes.push({
      data: {
        id: type,
        type,
        displayLabel: vtConfigs.get(type)?.displayLabel ?? type,
        ...styleData,
      },
    });
  }

  return nodes;
}

/** Transforms edge connections into schema graph edges, filtering out edges with missing nodes. */
function useSchemaGraphEdges(
  existingNodeIds: Set<VertexType>,
): SchemaGraphEdge[] {
  const schema = useActiveSchema();
  const edgeConnections = schema.edgeConnections ?? [];
  const etConfigs = useDisplayEdgeTypeConfigs();
  const styles = useAtomValue(edgeStyleAtom);

  // Many connections share an edge type, so style data is resolved on first
  // sight of a type — one `Color` parse per type, not per connection.
  const styleDataByType = new Map<EdgeType, EdgeStyleData>();
  const edges: SchemaGraphEdge[] = [];

  for (const connection of edgeConnections) {
    // Skip edges where source or target node doesn't exist
    if (!existingNodeIds.has(connection.sourceVertexType)) continue;
    if (!existingNodeIds.has(connection.targetVertexType)) continue;

    const edgeConfig = etConfigs.get(connection.edgeType);
    const displayLabel = edgeConfig?.displayLabel ?? connection.edgeType;

    let styleData = styleDataByType.get(connection.edgeType);
    if (styleData === undefined) {
      styleData = edgeStyleData(styles.get(connection.edgeType));
      styleDataByType.set(connection.edgeType, styleData);
    }

    edges.push({
      data: {
        id: createEdgeConnectionId(connection),
        source: connection.sourceVertexType,
        target: connection.targetVertexType,
        type: connection.edgeType,
        displayLabel,
        ...styleData,
      },
    });
  }

  return edges;
}
