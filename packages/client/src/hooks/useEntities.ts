import { useMemo } from "react";
import {
  SetterOrUpdater,
  useRecoilCallback,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import type { Edge, Vertex } from "../@types/entities";
import useConfiguration from "../core/ConfigurationProvider/useConfiguration";
import {
  edgesFilteredIdsAtom,
  edgesSelector,
  edgesTypesFilteredAtom,
} from "../core/StateProvider/edges";
import entitiesSelector, {
  Entities,
} from "../core/StateProvider/entitiesSelector";
import {
  nodesFilteredIdsAtom,
  nodesSelector,
  nodesTypesFilteredAtom,
} from "../core/StateProvider/nodes";

import useDeepMemo from "./useDeepMemo";

type ProcessedEntities = {
  nodes: Vertex[];
  edges: Edge[];
};

type UseEntitiesProps = {
  originalEntities: ProcessedEntities;
};

const useEntities = ({ disableFilters }: { disableFilters?: boolean } = {}): [
  ProcessedEntities,
  SetterOrUpdater<Entities>,
  UseEntitiesProps
] => {
  const config = useConfiguration();
  const filteredNodesIds = useRecoilValue(nodesFilteredIdsAtom);
  const filteredEdgesIds = useRecoilValue(edgesFilteredIdsAtom);
  const nodes = useRecoilValue(nodesSelector);
  const edges = useRecoilValue(edgesSelector);
  const recoilSetEntities = useSetRecoilState(entitiesSelector);

  // Some nodes/edges are not defined in the schema or their types are hidden.
  // Here these types are filtered before to set the updated state.
  // We need to make a hook because these types are defined in the config that
  // works using a hook.
  const setEntities: SetterOrUpdater<Entities> = useRecoilCallback(
    ({ snapshot }) => async valOrUpdater => {
      const entities = await snapshot.getPromise(entitiesSelector);
      const nextEntities =
        typeof valOrUpdater === "function"
          ? valOrUpdater(entities)
          : valOrUpdater;

      // Filter nodes that are defined and not hidden
      const filteredNodes = nextEntities.nodes.filter(node => {
        return !config?.schema?.vertices.find(
          vertex => vertex.type === node.data.type
        )?.hidden;
      });

      // Update counts filtering by defined and not hidden
      const nodesWithoutHiddenCounts = filteredNodes.map(node => {
        const [totalNeighborCount, totalNeighborCounts] = Object.entries(
          node.data.neighborsCountByType
        ).reduce(
          (totalNeighborsCounts, [type, count]) => {
            if (
              !config?.schema?.vertices.find(
                vertex => vertex.type === node.data.type
              )?.hidden
            ) {
              totalNeighborsCounts[1][type] = count;
            } else {
              totalNeighborsCounts[0] -= count;
            }

            return totalNeighborsCounts;
          },
          [node.data.neighborsCount, {}] as [
            number,
            typeof node.data.neighborsCountByType
          ]
        );

        return {
          ...node,
          data: {
            ...node.data,
            neighborsCount: totalNeighborCount,
            neighborsCountByType: totalNeighborCounts,
          },
        };
      });

      // Filter edges that are defined and not hidden
      const filteredEdges = nextEntities.edges.filter(edge => {
        return !config?.schema?.edges.find(e => e.type === edge.data.type)
          ?.hidden;
      });

      recoilSetEntities({
        nodes: nodesWithoutHiddenCounts,
        edges: filteredEdges,
        preserveSelection: nextEntities.preserveSelection,
        selectNewEntities: nextEntities.selectNewEntities,
        forceSet: nextEntities.forceSet,
      });
    },
    [config?.schema, recoilSetEntities]
  );

  const vertexTypes = useRecoilValue(nodesTypesFilteredAtom);
  const connectionTypes = useRecoilValue(edgesTypesFilteredAtom);

  const filteredEntitiesByGlobalFilters = useDeepMemo(() => {
    let filteredNodes = nodes;
    let filteredEdges = edges;
    if (!disableFilters) {
      filteredNodes = nodes.filter(node => {
        return vertexTypes.has(node.data.type);
      });

      filteredEdges = edges.filter(edge => {
        return (
          connectionTypes.has(edge.data.type) &&
          filteredNodes.some(node => node.data.id === edge.data.source) &&
          filteredNodes.some(node => node.data.id === edge.data.target)
        );
      });
    }
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [connectionTypes, disableFilters, edges, nodes, vertexTypes]);

  const filteredEntities = useMemo(() => {
    return {
      nodes: filteredEntitiesByGlobalFilters.nodes.filter(node => {
        return !filteredNodesIds.has(node.data.id);
      }),
      edges: filteredEntitiesByGlobalFilters.edges.filter(edge => {
        // Edges should not be in the filteredEdgesIds neither be unconnected
        return (
          !filteredEdgesIds.has(edge.data.id) &&
          !filteredNodesIds.has(edge.data.source) &&
          !filteredNodesIds.has(edge.data.target)
        );
      }),
    };
  }, [filteredEdgesIds, filteredEntitiesByGlobalFilters, filteredNodesIds]);

  return [
    filteredEntities,
    setEntities,
    {
      originalEntities: filteredEntitiesByGlobalFilters,
    },
  ];
};

export default useEntities;
