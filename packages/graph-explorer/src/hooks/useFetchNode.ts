import { useCallback } from "react";
import { Vertex } from "../@types/entities";
import useConnector from "../core/ConnectorProvider/useConnector";
import useEntities from "./useEntities";

const useFetchNode = () => {
  const [, setEntities] = useEntities();
  const connector = useConnector();

  const fetchNeighborsCount = useCallback(
    (vertexId: string, neighbors_limit: number) => {
      return connector.explorer?.fetchNeighborsCount({
        vertexId: vertexId,
        limit: neighbors_limit,
      });
    },
    [connector.explorer]
  );

  return useCallback(
    async (nodeOrNodes: Vertex | Vertex[], limit: number) => {
      const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];
      const neighbors_limit = limit;

      const results = await Promise.all(
        nodes.map(async node => {
          const neighborsCount = await fetchNeighborsCount(node.data.id, neighbors_limit);
          if (!neighborsCount) {
            return;
          }

          return {
            data: {
              ...node.data,
              neighborsCount:
                neighborsCount?.totalCount || node.data.neighborsCount,
              neighborsCountByType: {
                ...(node.data.neighborsCountByType || {}),
                ...(neighborsCount.counts || {}),
              },
            },
          };
        })
      );

      const validResults = results.filter(Boolean) as Vertex[];

      if (!validResults.length) {
        return;
      }

      setEntities({
        nodes: validResults,
        edges: [],
        selectNewEntities: "nodes",
      });
    },
    [fetchNeighborsCount, setEntities]
  );
};

export default useFetchNode;
