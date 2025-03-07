import {
  activeSchemaSelector,
  Edge,
  edgesAtom,
  nodesAtom,
  toEdgeMap,
  toNodeMap,
  updateSchemaFromEntities,
  useUpdateGraphSession,
  Vertex,
} from "@/core";
import { startTransition, useCallback } from "react";
import { useSetRecoilState } from "recoil";

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useAddToGraph() {
  const setVertices = useSetRecoilState(nodesAtom);
  const setEdges = useSetRecoilState(edgesAtom);
  const setActiveSchema = useSetRecoilState(activeSchemaSelector);
  const updateGraphStorage = useUpdateGraphSession();

  return useCallback(
    (entities: { vertices?: Vertex[]; edges?: Edge[] }) => {
      const vertices = entities.vertices ?? [];
      const edges = entities.edges ?? [];

      // Ensure there is something to add
      if (vertices.length === 0 && edges.length === 0) {
        return;
      }

      const newVerticesMap = toNodeMap(vertices);
      const newEdgesMap = toEdgeMap(edges);

      startTransition(() => {
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

        updateGraphStorage();
      });
    },
    [setActiveSchema, setEdges, setVertices, updateGraphStorage]
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
