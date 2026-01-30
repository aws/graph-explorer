import type { GraphEdge, GraphNode } from "@/components/Graph";

import {
  createEdgeConnectionId,
  type EdgeConnectionId,
  useActiveSchema,
  useDisplayEdgeTypeConfigs,
  useDisplayVertexTypeConfigs,
} from "@/core";

type SchemaGraphNode = GraphNode & {
  data: {
    id: string;
    type: string;
    displayLabel: string;
  };
};

type SchemaGraphEdge = GraphEdge & {
  data: {
    id: EdgeConnectionId;
    source: string;
    target: string;
    type: string;
    displayLabel: string;
  };
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

  const nodes: SchemaGraphNode[] = [];

  for (const config of vtConfigs.values()) {
    nodes.push({
      data: {
        id: config.type,
        type: config.type,
        displayLabel: config.displayLabel,
      },
    });
  }

  return nodes;
}

/** Transforms edge connections into schema graph edges, filtering out edges with missing nodes. */
function useSchemaGraphEdges(existingNodeIds: Set<string>): SchemaGraphEdge[] {
  const schema = useActiveSchema();
  const edgeConnections = schema.edgeConnections ?? [];
  const etConfigs = useDisplayEdgeTypeConfigs();

  const edges: SchemaGraphEdge[] = [];

  for (const connection of edgeConnections) {
    // Skip edges where source or target node doesn't exist
    if (!existingNodeIds.has(connection.sourceVertexType)) continue;
    if (!existingNodeIds.has(connection.targetVertexType)) continue;

    const edgeConfig = etConfigs.get(connection.edgeType);
    const displayLabel = edgeConfig?.displayLabel ?? connection.edgeType;

    edges.push({
      data: {
        id: createEdgeConnectionId(connection),
        source: connection.sourceVertexType,
        target: connection.targetVertexType,
        type: connection.edgeType,
        displayLabel,
      },
    });
  }

  return edges;
}
