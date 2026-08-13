import { useAtomValue } from "jotai";

import type { GraphEdge, GraphNode } from "@/components/Graph";

import {
  createEdgeConnectionId,
  type EdgeConnectionId,
  edgeStyleAtom,
  edgeStyleData,
  type EdgeStyleData,
  type EdgeType,
  useActiveSchema,
  useAllVertexStyles,
  useDisplayEdgeTypeConfigs,
  useDisplayVertexTypeConfigs,
  vertexStyleAtom,
  vertexStyleData,
  type VertexStyleData,
  type VertexType,
} from "@/core";
import { useBackgroundImageMap } from "@/core/icons";

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
  const vertexStyles = useAtomValue(vertexStyleAtom);
  const backgroundImages = useBackgroundImageMap(useAllVertexStyles());

  const nodes: SchemaGraphNode[] = [];

  for (const config of vtConfigs.values()) {
    const style = vertexStyles.get(config.type);
    const backgroundImage = backgroundImages.get(config.type);
    nodes.push({
      data: {
        id: config.type,
        type: config.type,
        displayLabel: config.displayLabel,
        ...vertexStyleData(style, backgroundImage),
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
  const edgeStyles = useAtomValue(edgeStyleAtom);

  const edges: SchemaGraphEdge[] = [];

  for (const connection of edgeConnections) {
    // Skip edges where source or target node doesn't exist
    if (!existingNodeIds.has(connection.sourceVertexType)) continue;
    if (!existingNodeIds.has(connection.targetVertexType)) continue;

    const edgeConfig = etConfigs.get(connection.edgeType);
    const displayLabel = edgeConfig?.displayLabel ?? connection.edgeType;
    const style = edgeStyles.get(connection.edgeType);

    edges.push({
      data: {
        id: createEdgeConnectionId(connection),
        source: connection.sourceVertexType,
        target: connection.targetVertexType,
        type: connection.edgeType,
        displayLabel,
        ...edgeStyleData(style),
      },
    });
  }

  return edges;
}
