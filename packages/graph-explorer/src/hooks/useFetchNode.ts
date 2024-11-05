import { useCallback, useMemo } from "react";
import { Edge, EdgeId, Vertex, VertexId } from "@/types/entities";
import useEntities from "./useEntities";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";

/** Returns a callback that adds a node or array of nodes to the graph. */
export default function useFetchNode() {
  const [, setEntities] = useEntities();

  return useCallback(
    (nodeOrNodes: Vertex | Vertex[]) => {
      const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];

      const validResults = nodes.filter(Boolean);

      if (!validResults.length) {
        return;
      }

      setEntities({
        nodes: toNodeMap(validResults),
        edges: new Map(),
        selectNewEntities: "nodes",
      });
    },
    [setEntities]
  );
}

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useAddToGraph(nodes: Vertex[], edges: Edge[]) {
  const [, setEntities] = useEntities();

  return () => {
    if (nodes.length === 0 && edges.length === 0) {
      return;
    }

    setEntities({
      nodes: toNodeMap(nodes),
      edges: toEdgeMap(edges),
    });
  };
}

/** Returns a callback that adds an array of nodes to the graph. */
export function useRemoveNodeFromGraph(nodeId: VertexId) {
  const [, setEntities] = useEntities();

  return () => {
    setEntities(prev => {
      return {
        ...prev,
        nodes: new Map(prev.nodes.entries().filter(([id]) => id !== nodeId)),
        forceSet: true,
      };
    });
  };
}
export function useRemoveEdgeFromGraph(edgeId: EdgeId) {
  const [, setEntities] = useEntities();

  return () => {
    setEntities(prev => {
      return {
        ...prev,
        edges: new Map(prev.edges.entries().filter(([id]) => id !== edgeId)),
        forceSet: true,
      };
    });
  };
}

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useHasNodeBeenAddedToGraph(id: VertexId) {
  const [entities, _] = useEntities();

  return useMemo(() => entities.nodes.has(id), [entities, id]);
}

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useHasEdgeBeenAddedToGraph(id: EdgeId) {
  const [entities, _] = useEntities();

  return useMemo(() => entities.edges.has(id), [entities, id]);
}
