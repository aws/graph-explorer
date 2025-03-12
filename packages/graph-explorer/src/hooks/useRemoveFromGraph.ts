import {
  activeGraphSessionAtom,
  EdgeId,
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
  useUpdateGraphSession,
  VertexId,
} from "@/core";
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from "recoil";
import { startTransition, useCallback } from "react";
import { logger } from "@/utils";

export function useRemoveFromGraph() {
  const setVertices = useSetRecoilState(nodesAtom);
  const setEdges = useSetRecoilState(edgesAtom);
  const setSelectedVertices = useSetRecoilState(nodesSelectedIdsAtom);
  const setSelectedEdges = useSetRecoilState(edgesSelectedIdsAtom);
  const setOutOfFocusVertices = useSetRecoilState(nodesOutOfFocusIdsAtom);
  const setOutOfFocusEdges = useSetRecoilState(edgesOutOfFocusIdsAtom);
  const setFilteredVertices = useSetRecoilState(nodesFilteredIdsAtom);
  const setFilteredEdges = useSetRecoilState(edgesFilteredIdsAtom);

  const allEdges = useRecoilValue(edgesAtom);

  const updateGraphStorage = useUpdateGraphSession();

  return useCallback(
    (entities: { vertices?: VertexId[]; edges?: EdgeId[] }) => {
      const vertices = new Set(entities.vertices ?? []);
      const edges = new Set(entities.edges ?? []);

      // Ensure there is something to remove
      if (vertices.size === 0 && edges.size === 0) {
        return;
      }

      // Find associated edges for removed vertices
      const associatedEdges = new Set(
        allEdges
          .entries()
          .filter(
            ([_id, edge]) =>
              vertices.has(edge.source) || vertices.has(edge.target)
          )
          .map(([id]) => id)
      );
      const edgesToRemove = edges.union(associatedEdges);

      startTransition(() => {
        // Remove vertices
        if (vertices.size > 0) {
          setVertices(prev => deleteFromMap(prev, vertices));
          setSelectedVertices(prev => prev.difference(vertices));
          setOutOfFocusVertices(prev => prev.difference(vertices));
          setFilteredVertices(prev => prev.difference(vertices));
        }

        // Remove edges
        if (edgesToRemove.size > 0) {
          setEdges(prev => deleteFromMap(prev, edgesToRemove));
          setSelectedEdges(prev => prev.difference(edgesToRemove));
          setOutOfFocusEdges(prev => prev.difference(edgesToRemove));
          setFilteredEdges(prev => prev.difference(edgesToRemove));
        }

        updateGraphStorage();
      });
    },
    [
      allEdges,
      updateGraphStorage,
      setVertices,
      setSelectedVertices,
      setOutOfFocusVertices,
      setFilteredVertices,
      setEdges,
      setSelectedEdges,
      setOutOfFocusEdges,
      setFilteredEdges,
    ]
  );
}

function deleteFromMap<Key, Value>(map: Map<Key, Value>, keys: Set<Key>) {
  const copiedMap = new Map(map);
  keys.forEach(id => {
    copiedMap.delete(id);
  });
  return copiedMap;
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
  const resetVertices = useResetRecoilState(nodesAtom);
  const resetEdges = useResetRecoilState(edgesAtom);
  const resetSelectedVertices = useResetRecoilState(nodesSelectedIdsAtom);
  const resetSelectedEdges = useResetRecoilState(edgesSelectedIdsAtom);
  const resetOutOfFocusVertices = useResetRecoilState(nodesOutOfFocusIdsAtom);
  const resetOutOfFocusEdges = useResetRecoilState(edgesOutOfFocusIdsAtom);
  const resetFilteredVertices = useResetRecoilState(nodesFilteredIdsAtom);
  const resetFilteredEdges = useResetRecoilState(edgesFilteredIdsAtom);
  const resetActiveGraph = useResetRecoilState(activeGraphSessionAtom);

  return useCallback(() => {
    logger.log("Clearing graph state...");
    resetVertices();
    resetEdges();
    resetSelectedVertices();
    resetSelectedEdges();
    resetOutOfFocusVertices();
    resetOutOfFocusEdges();
    resetFilteredVertices();
    resetFilteredEdges();
    resetActiveGraph();
  }, [
    resetVertices,
    resetEdges,
    resetSelectedVertices,
    resetSelectedEdges,
    resetOutOfFocusVertices,
    resetOutOfFocusEdges,
    resetFilteredVertices,
    resetFilteredEdges,
    resetActiveGraph,
  ]);
}
