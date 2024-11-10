import { useMemo } from "react";
import { Edge, EdgeId, Vertex, VertexId } from "@/types/entities";
import useEntities from "./useEntities";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useAddToGraph(...entitiesToAdd: (Vertex | Edge)[]) {
  const [, setEntities] = useEntities();

  const nodes = entitiesToAdd.filter(e => e.entityType === "vertex");
  const edges = entitiesToAdd.filter(e => e.entityType === "edge");

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
