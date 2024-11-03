import { useMemo } from "react";
import { SetterOrUpdater, useRecoilCallback, useRecoilValue } from "recoil";
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
import { assembledConfigSelector } from "@/core/ConfigurationProvider/useConfiguration";

type ProcessedEntities = {
  nodes: Map<VertexId, Vertex>;
  edges: Map<EdgeId, Edge>;
};

const useEntities = ({ disableFilters }: { disableFilters?: boolean } = {}): [
  ProcessedEntities,
  SetterOrUpdater<Entities>,
] => {
  const filteredNodesIds = useRecoilValue(nodesFilteredIdsAtom);
  const filteredEdgesIds = useRecoilValue(edgesFilteredIdsAtom);
  const nodes = useRecoilValue(nodesSelector);
  const edges = useRecoilValue(edgesSelector);

  // Some nodes/edges are not defined in the schema or their types are hidden.
  // Here these types are filtered before to set the updated state.
  // We need to make a hook because these types are defined in the config that
  // works using a hook.
  const setEntities: SetterOrUpdater<Entities> = useRecoilCallback(
    ({ snapshot, set }) =>
      async valOrUpdater => {
        const config = await snapshot.getPromise(assembledConfigSelector);
        const entities = await snapshot.getPromise(entitiesSelector);
        const nextEntities =
          typeof valOrUpdater === "function"
            ? valOrUpdater(entities)
            : valOrUpdater;

        // Filter nodes that are defined and not hidden
        const filteredNodes = new Map(
          nextEntities.nodes.entries().filter(([_id, node]) => {
            return !config?.getVertexTypeConfig(node.type)?.hidden;
          })
        );

        // Update counts filtering by defined and not hidden
        const nodesWithoutHiddenCounts = new Map(
          filteredNodes.entries().map(([id, node]) => {
            const [totalNeighborCount, totalNeighborCounts] = Object.entries(
              node.neighborsCountByType
            ).reduce(
              (totalNeighborsCounts, [type, count]) => {
                if (!config?.getVertexTypeConfig(node.type)?.hidden) {
                  totalNeighborsCounts[1][type] = count;
                } else {
                  totalNeighborsCounts[0] -= count;
                }

                return totalNeighborsCounts;
              },
              [node.neighborsCount, {}] as [
                number,
                typeof node.neighborsCountByType,
              ]
            );

            return [
              id,
              <Vertex>{
                ...node,
                neighborsCount: totalNeighborCount,
                neighborsCountByType: totalNeighborCounts,
              },
            ];
          })
        );

        // Filter edges that are defined and not hidden
        const filteredEdges = new Map(
          nextEntities.edges.entries().filter(([_id, edge]) => {
            return !config?.getEdgeTypeConfig(edge.type)?.hidden;
          })
        );

        set(entitiesSelector, {
          nodes: nodesWithoutHiddenCounts,
          edges: filteredEdges,
          preserveSelection: nextEntities.preserveSelection,
          selectNewEntities: nextEntities.selectNewEntities,
          forceSet: nextEntities.forceSet,
        });
      },
    [] // Ensures this callback is memoized and not recreated on each render
  );

  const vertexTypes = useRecoilValue(nodesTypesFilteredAtom);
  const connectionTypes = useRecoilValue(edgesTypesFilteredAtom);

  const filteredEntitiesByGlobalFilters = useDeepMemo(() => {
    let filteredNodes = nodes;
    let filteredEdges = edges;
    if (!disableFilters) {
      filteredNodes = new Map(
        nodes.entries().filter(([_id, node]) => {
          return vertexTypes.has(node.type) === false;
        })
      );

      filteredEdges = new Map(
        edges.entries().filter(([_id, edge]) => {
          return (
            connectionTypes.has(edge.type) === false &&
            filteredNodes.has(edge.source) &&
            filteredNodes.has(edge.target)
          );
        })
      );
    }
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [connectionTypes, disableFilters, edges, nodes, vertexTypes]);

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
