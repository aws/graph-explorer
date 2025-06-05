import { useNotification } from "@/components/NotificationProvider";
import {
  activeSchemaSelector,
  createVertex,
  Edge,
  edgesAtom,
  nodesAtom,
  toEdgeMap,
  toNodeMap,
  updateSchemaFromEntities,
  useUpdateGraphSession,
  Vertex,
} from "@/core";
import { logger } from "@/utils";
import { createDisplayError } from "@/utils/createDisplayError";
import { useMutation } from "@tanstack/react-query";
import { useMaterializeVertices } from "./useMaterializeVertices";
import { useMaterializeEdges } from "./useMaterializeEdges";
import { useSetAtom } from "jotai";

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useAddToGraph() {
  const setVertices = useSetAtom(nodesAtom);
  const setEdges = useSetAtom(edgesAtom);
  const setActiveSchema = useSetAtom(activeSchemaSelector);
  const updateGraphStorage = useUpdateGraphSession();
  const materializeVertices = useMaterializeVertices();
  const materializeEdges = useMaterializeEdges();

  return async (entities: { vertices?: Vertex[]; edges?: Edge[] }) => {
    const vertices = toNodeMap(entities.vertices ?? []);
    const edges = toEdgeMap(entities.edges ?? []);

    // Add fragment vertices from the edges if they are missing
    for (const edge of edges.values()) {
      if (!vertices.has(edge.source)) {
        vertices.set(
          edge.source,
          createVertex({ id: edge.source, types: edge.sourceTypes })
        );
      }

      if (!vertices.has(edge.target)) {
        vertices.set(
          edge.target,
          createVertex({ id: edge.target, types: edge.targetTypes })
        );
      }
    }

    // Ensure all fragments are materialized
    const newVerticesMap = await materializeVertices(vertices);
    const newEdgesMap = await materializeEdges(edges);

    // Ensure there is something to add
    if (newVerticesMap.size === 0 && newEdgesMap.size === 0) {
      return;
    }

    // Add new vertices to the graph
    if (newVerticesMap.size > 0) {
      setVertices(prev => new Map([...prev, ...newVerticesMap]));
    }

    // Add new edges to the graph
    if (newEdgesMap.size > 0) {
      setEdges(prev => new Map([...prev, ...newEdgesMap]));
    }

    // Update the schema with any new vertex or edge types or attributes
    setActiveSchema(prev => {
      if (!prev) {
        return prev;
      }
      return updateSchemaFromEntities(
        { nodes: newVerticesMap, edges: newEdgesMap },
        prev
      );
    });

    await updateGraphStorage();
  };
}

/** Returns a callback the given vertex to the graph. */
export function useAddVertexToGraph(vertex: Vertex) {
  const callback = useAddToGraph();
  return () => callback({ vertices: [vertex] });
}

/** Returns a callback the given edge to the graph. */
export function useAddEdgeToGraph(edge: Edge) {
  const callback = useAddToGraph();
  return () => callback({ edges: [edge] });
}

/**
 * Wraps sendToGraph in a mutation which allows monitoring progress and error state.
 *
 * On error, a toast notification will be shown.
 */
export function useAddToGraphMutation() {
  const { enqueueNotification } = useNotification();
  const sendToGraph = useAddToGraph();
  return useMutation({
    mutationFn: sendToGraph,
    onError: error => {
      const displayError = createDisplayError(error);
      enqueueNotification({
        ...displayError,
        type: "error",
      });
      logger.error("Failed to add all to graph", error);
    },
  });
}
