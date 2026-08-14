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
  useAllVertexStyles,
  useDisplayEdgeTypeConfigs,
  useDisplayVertexTypeConfigs,
  useVertexStyleDataByType,
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

/** Transforms vertex type configs into schema graph nodes. */
function useSchemaGraphNodes(): SchemaGraphNode[] {
  const vtConfigs = useDisplayVertexTypeConfigs();
  // The schema view draws every type, so every type's icon is in scope here.
  const styleDataByType = useVertexStyleDataByType(useAllVertexStyles());

  const nodes: SchemaGraphNode[] = [];

  for (const config of vtConfigs.values()) {
    const styleData = styleDataByType.get(config.type);
    // Both the configs and the styles come from the active schema's vertices.
    if (styleData === undefined) {
      throw new Error(
        `No style data resolved for schema vertex type "${config.type}"`,
      );
    }

    nodes.push({
      data: {
        id: config.type,
        type: config.type,
        displayLabel: config.displayLabel,
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
