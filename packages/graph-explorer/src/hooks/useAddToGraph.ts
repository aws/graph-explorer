import { Edge, Vertex } from "@/core";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";
import entitiesSelector from "@/core/StateProvider/entitiesSelector";
import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

/** Returns a callback that adds an array of nodes and edges to the graph. */
export function useAddToGraph(...entitiesToAdd: (Vertex | Edge)[]) {
  const setEntities = useSetRecoilState(entitiesSelector);

  return useCallback(() => {
    const nodes = entitiesToAdd.filter(e => e.entityType === "vertex");
    const edges = entitiesToAdd.filter(e => e.entityType === "edge");

    if (nodes.length === 0 && edges.length === 0) {
      return;
    }

    setEntities({
      nodes: toNodeMap(nodes),
      edges: toEdgeMap(edges),
    });
  }, [entitiesToAdd, setEntities]);
}
