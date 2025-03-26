import { useNotification } from "@/components/NotificationProvider";
import { vertexDetailsQuery, VertexDetailsRequest } from "@/connector";
import {
  activeSchemaSelector,
  createVertex,
  Edge,
  edgesAtom,
  nodesAtom,
  toEdgeMap,
  toNodeMap,
  updateSchemaFromEntities,
  useExplorer,
  useUpdateGraphSession,
  Vertex,
  VertexId,
} from "@/core";
import { logger } from "@/utils";
import { createDisplayError } from "@/utils/createDisplayError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startTransition, useCallback } from "react";
import { useSetRecoilState } from "recoil";

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useAddToGraph() {
  const setVertices = useSetRecoilState(nodesAtom);
  const setEdges = useSetRecoilState(edgesAtom);
  const setActiveSchema = useSetRecoilState(activeSchemaSelector);
  const updateGraphStorage = useUpdateGraphSession();
  const materializeVertices = useMaterializeVertices();

  return useCallback(
    async (entities: { vertices?: Vertex[]; edges?: Edge[] }) => {
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

      // Ensure there is something to add
      if (newVerticesMap.size === 0 && edges.size === 0) {
        return;
      }

      startTransition(() => {
        // Add new vertices to the graph
        if (newVerticesMap.size > 0) {
          setVertices(prev => new Map([...prev, ...newVerticesMap]));
        }

        // Add new edges to the graph
        if (edges.size > 0) {
          setEdges(prev => new Map([...prev, ...edges]));
        }

        // Update the schema with any new vertex or edge types or attributes
        setActiveSchema(prev => {
          if (!prev) {
            return prev;
          }
          return updateSchemaFromEntities(
            { nodes: newVerticesMap, edges: edges },
            prev
          );
        });

        updateGraphStorage();
      });
    },
    [
      materializeVertices,
      setActiveSchema,
      setEdges,
      setVertices,
      updateGraphStorage,
    ]
  );
}

/** Fetch the details if the vertex is a fragment. */
function useMaterializeVertices() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();

  return useCallback(
    async (vertices: Map<VertexId, Vertex>) => {
      const responses = await Promise.all(
        vertices.values().map(async vertex => {
          if (!vertex.__isFragment) {
            return vertex;
          }

          const request: VertexDetailsRequest = {
            vertexId: vertex.id,
          };
          const response = await queryClient.ensureQueryData(
            vertexDetailsQuery(request, explorer)
          );
          return response.vertex;
        })
      );
      return toNodeMap(responses.filter(vertex => vertex != null));
    },
    [queryClient, explorer]
  );
}

/** Returns a callback the given vertex to the graph. */
export function useAddVertexToGraph(vertex: Vertex) {
  const callback = useAddToGraph();
  return useCallback(
    () => callback({ vertices: [vertex] }),
    [callback, vertex]
  );
}

/** Returns a callback the given edge to the graph. */
export function useAddEdgeToGraph(edge: Edge) {
  const callback = useAddToGraph();
  return useCallback(() => callback({ edges: [edge] }), [callback, edge]);
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
