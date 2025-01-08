import { useMemo } from "react";
import { SetterOrUpdater, useRecoilValue, useSetRecoilState } from "recoil";
import type { Edge, EdgeId, Vertex, VertexId } from "@/types/entities";
import entitiesSelector, {
  Entities,
} from "@/core/StateProvider/entitiesSelector";
import { filteredNodesSelector, filteredEdgesSelector } from "@/core";

type ProcessedEntities = {
  nodes: Map<VertexId, Vertex>;
  edges: Map<EdgeId, Edge>;
};

/** Returns the current set of filtered entities. */
export default function useEntities(): [
  ProcessedEntities,
  SetterOrUpdater<Entities>,
] {
  const setEntities = useSetRecoilState(entitiesSelector);

  const preFilteredNodes = useRecoilValue(filteredNodesSelector);
  const preFilteredEdges = useRecoilValue(filteredEdgesSelector);

  const filteredEntities = useMemo(
    () => ({
      nodes: preFilteredNodes,
      edges: preFilteredEdges,
    }),
    [preFilteredEdges, preFilteredNodes]
  );

  return [filteredEntities, setEntities];
}
