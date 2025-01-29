import { Edge, Vertex } from "@/core";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";
import entitiesSelector from "@/core/StateProvider/entitiesSelector";
import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useAddToGraph() {
  const setEntities = useSetRecoilState(entitiesSelector);

  return useCallback(
    (entities: { vertices?: Vertex[]; edges?: Edge[] }) => {
      const vertices = entities.vertices ?? [];
      const edges = entities.edges ?? [];

      if (vertices.length === 0 && edges.length === 0) {
        return;
      }

      setEntities({
        nodes: toNodeMap(vertices),
        edges: toEdgeMap(edges),
      });
    },
    [setEntities]
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
