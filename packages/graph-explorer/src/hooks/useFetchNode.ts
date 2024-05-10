import { useCallback } from "react";
import { Vertex } from "../@types/entities";
import { explorerSelector } from "../core/connector";
import useEntities from "./useEntities";
import { NeighborsCountRequest } from "../connector/useGEFetchTypes";
import { useRecoilValue } from "recoil";

const useFetchNode = () => {
  const [, setEntities] = useEntities();
  const explorer = useRecoilValue(explorerSelector);

  const fetchNeighborsCount = useCallback(
    (req: NeighborsCountRequest) => {
      return explorer?.fetchNeighborsCount(req);
    },
    [explorer]
  );

  return useCallback(
    async (nodeOrNodes: Vertex | Vertex[], limit: number) => {
      const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];
      const neighbors_limit = limit;

      const results = await Promise.all(
        nodes.map(async node => {
          const neighborsCount = await fetchNeighborsCount({
            vertexId: node.data.id,
            idType: node.data.idType,
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
