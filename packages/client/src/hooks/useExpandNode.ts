import debounce from "lodash/debounce";
import { useCallback } from "react";
import { useNotification } from "../components/NotificationProvider";
import type { NeighborsRequest } from "../connector/AbstractConnector";
import useConnector from "../core/ConnectorProvider/useConnector";
import useEntities from "./useEntities";

const useExpandNode = () => {
  const [, setEntities] = useEntities();
  const connector = useConnector();
  const { enqueueNotification, clearNotification } = useNotification();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetEntities = useCallback(debounce(setEntities, 400), [
    setEntities,
  ]);

  return useCallback(
    async (req: NeighborsRequest) => {
      const result = await connector.explorer?.fetchNeighbors(req);

      if (!result || (!result.vertices.length && !result.edges.length)) {
        enqueueNotification({
          title: "No Results",
          message: "Your search has returned no results",
        });
        return;
      }

      debouncedSetEntities({
        nodes: result.vertices,
        edges: result.edges,
        selectNewEntities: "nodes",
      });

      const notificationId = enqueueNotification({
        title: "Updating Neighbors",
        message: `Looking for the Neighbors of ${result.vertices.length} results`,
        autoHideDuration: null,
      });

      const verticesWithUpdatedCounts = await Promise.all(
        result.vertices.map(async vertex => {
          const neighborsCount = await connector.explorer?.fetchNeighborsCount({
            vertexId: vertex.data.id,
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
      debouncedSetEntities(prev => ({
        nodes: prev.nodes.map(node => {
          const nodeWithCounts = verticesWithUpdatedCounts.find(
            v => v.data.id === node.data.id
          );

          if (!nodeWithCounts) {
            return node;
          }

          return nodeWithCounts;
        }),
        edges: [],
      }));
    },
    [
      connector.explorer,
      debouncedSetEntities,
      enqueueNotification,
      clearNotification,
    ]
  );
};

export default useExpandNode;
