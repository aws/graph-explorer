import { useCallback } from "react";
import { useNotification } from "../components/NotificationProvider";
import type { NeighborsRequest } from "../connector/useGEFetchTypes";
import { explorerSelector } from "../core/ConnectorProvider/useConnector";
import useEntities from "./useEntities";
import { Vertex } from "../@types/entities";
import { useRecoilValue } from "recoil";

const useExpandNode = () => {
  const [, setEntities] = useEntities();
  const explorer = useRecoilValue(explorerSelector);
  const { enqueueNotification, clearNotification } = useNotification();

  return useCallback(
    async (req: NeighborsRequest) => {
      const result = await explorer?.fetchNeighbors(req);

      if (!result || !result.vertices.length) {
        enqueueNotification({
          title: "No Results",
          message: "Your search has returned no results",
        });
        return;
      }

      setEntities({
        nodes: result.vertices,
        edges: result.edges,
        selectNewEntities: "nodes",
      });

      const notificationId = enqueueNotification({
        title: "Updating Neighbors",
        message: `Looking for the Neighbors of ${result.vertices.length} results`,
        autoHideDuration: null,
      });

      const verticesWithUpdatedCounts = await Promise.all<Vertex>(
        result.vertices.map(async vertex => {
          const neighborsCount = await explorer?.fetchNeighborsCount({
            vertexId: vertex.data.id,
            idType: vertex.data.idType,
          });

          return {
            ...vertex,
            data: {
              ...vertex.data,
              neighborsCount:
                neighborsCount?.totalCount ?? vertex.data.neighborsCount,
              neighborsCountByType:
                neighborsCount?.counts ?? vertex.data.neighborsCountByType,
            },
          };
        })
      );

      clearNotification(notificationId);
      setEntities(prev => ({
        nodes: prev.nodes.map(node => {
          const nodeWithCounts = verticesWithUpdatedCounts.find(
            v => v.data.id === node.data.id
          );

          if (!nodeWithCounts) {
            return node;
          }

          return nodeWithCounts;
        }),
        edges: result.edges,
      }));
    },
    [explorer, setEntities, enqueueNotification, clearNotification]
  );
};

export default useExpandNode;
