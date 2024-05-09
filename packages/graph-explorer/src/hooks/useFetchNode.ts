import { useCallback } from "react";
import { Vertex } from "../@types/entities";
import useConnector from "../core/ConnectorProvider/useConnector";
import useEntities from "./useEntities";
import { NeighborsCountRequest } from "../connector/useGEFetchTypes";

const useFetchNode = () => {
  const [, setEntities] = useEntities();
  const connector = useConnector();

  const fetchNeighborsCount = useCallback(
    (req: NeighborsCountRequest) => {
      return connector.explorer?.fetchNeighborsCount(req);
    },
    [connector.explorer]
  );

  return useCallback(
    async (nodeOrNodes: Vertex | Vertex[], limit: number) => {
      const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];
      const neighbors_limit = limit;

      const results = await Promise.all(
        nodes.map(async node => {
          const neighborsCount = await fetchNeighborsCount({
            vertexId: node.data.id,
            limit: neighbors_limit,
          });
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
