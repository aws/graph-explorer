import { EdgeId, VertexId } from "@/core";
import entitiesSelector from "@/core/StateProvider/entitiesSelector";
import { useSetRecoilState } from "recoil";
import { useCallback } from "react";

export function useRemoveFromGraph() {
  const setEntities = useSetRecoilState(entitiesSelector);

  return useCallback(
    (entities: { vertices?: VertexId[]; edges?: EdgeId[] }) => {
      const vertices = new Set(entities.vertices ?? []);
      const edges = new Set(entities.edges ?? []);

      // Ensure there is something to remove
      if (vertices.size === 0 && edges.size === 0) {
        return;
      }

      setEntities(prev => ({
        nodes: new Map(
          prev.nodes.entries().filter(([id]) => !vertices.has(id))
        ),
        edges: new Map(prev.edges.entries().filter(([id]) => !edges.has(id))),
        forceSet: true,
      }));
    },
    [setEntities]
  );
}

export function useRemoveNodeFromGraph(nodeId: VertexId) {
  const removeFromGraph = useRemoveFromGraph();

  return useCallback(() => {
    removeFromGraph({ vertices: [nodeId] });
  }, [nodeId, removeFromGraph]);
}

export function useRemoveEdgeFromGraph(edgeId: EdgeId) {
  const removeFromGraph = useRemoveFromGraph();

  return useCallback(() => {
    removeFromGraph({ edges: [edgeId] });
  }, [edgeId, removeFromGraph]);
}

export function useClearGraph() {
  const setEntities = useSetRecoilState(entitiesSelector);

  return useCallback(() => {
    setEntities({
      nodes: new Map(),
      edges: new Map(),
      forceSet: true,
    });
  }, [setEntities]);
}
