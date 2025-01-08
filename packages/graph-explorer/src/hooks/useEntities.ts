import { useMemo } from "react";
import { SetterOrUpdater, useRecoilValue, useSetRecoilState } from "recoil";
import type { Edge, EdgeId, Vertex, VertexId } from "@/types/entities";
import {
  edgesFilteredIdsAtom,
  edgesSelector,
  edgesTypesFilteredAtom,
} from "@/core/StateProvider/edges";
import entitiesSelector, {
  Entities,
} from "@/core/StateProvider/entitiesSelector";
import {
  nodesFilteredIdsAtom,
  nodesSelector,
  nodesTypesFilteredAtom,
} from "@/core/StateProvider/nodes";

import useDeepMemo from "./useDeepMemo";

type ProcessedEntities = {
  nodes: Map<VertexId, Vertex>;
  edges: Map<EdgeId, Edge>;
};

const useEntities = (): [ProcessedEntities, SetterOrUpdater<Entities>] => {
  const filteredNodesIds = useRecoilValue(nodesFilteredIdsAtom);
  const filteredEdgesIds = useRecoilValue(edgesFilteredIdsAtom);
  const nodes = useRecoilValue(nodesSelector);
  const edges = useRecoilValue(edgesSelector);

  const setEntities = useSetRecoilState(entitiesSelector);

  const vertexTypes = useRecoilValue(nodesTypesFilteredAtom);
  const connectionTypes = useRecoilValue(edgesTypesFilteredAtom);

  const filteredEntitiesByGlobalFilters = useDeepMemo(() => {
    const filteredNodes = new Map(
      nodes.entries().filter(([_id, node]) => {
        return vertexTypes.has(node.type) === false;
      })
    );

    const filteredEdges = new Map(
      edges.entries().filter(([_id, edge]) => {
        return (
          connectionTypes.has(edge.type) === false &&
          filteredNodes.has(edge.source) &&
          filteredNodes.has(edge.target)
        );
      })
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [connectionTypes, edges, nodes, vertexTypes]);

  const filteredEntities = useMemo(() => {
    return <ProcessedEntities>{
      nodes: new Map(
        filteredEntitiesByGlobalFilters.nodes
          .entries()
          .filter(([id, _node]) => {
            return !filteredNodesIds.has(id);
          })
      ),
      edges: new Map(
        filteredEntitiesByGlobalFilters.edges
          .entries()
          .filter(([_id, edge]) => {
            // Edges should not be in the filteredEdgesIds neither be unconnected
            return (
              !filteredEdgesIds.has(edge.id) &&
              !filteredNodesIds.has(edge.source) &&
              !filteredNodesIds.has(edge.target)
            );
          })
      ),
    };
  }, [filteredEdgesIds, filteredEntitiesByGlobalFilters, filteredNodesIds]);

  return [filteredEntities, setEntities];
};

export default useEntities;
