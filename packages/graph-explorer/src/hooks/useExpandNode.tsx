import { useCallback, useEffect } from "react";
import { useNotification } from "@/components/NotificationProvider";
import {
  updateEdgeDetailsCache,
  updateVertexDetailsCache,
  type NeighborsRequest,
  type NeighborsResponse,
} from "@/connector";
import { loggerSelector, useExplorer } from "@/core/connector";
import useEntities from "./useEntities";
import { useRecoilValue } from "recoil";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Vertex } from "@/core";
import { createDisplayError } from "@/utils/createDisplayError";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";
import { useNeighborsCallback } from "@/core";

export type ExpandNodeFilters = Omit<
  NeighborsRequest,
  "vertexId" | "vertexType"
>;

export type ExpandNodeRequest = {
  vertex: Vertex;
  filters?: ExpandNodeFilters;
};

/**
 * Provides a callback to submit a node expansion request, the query
 * information, and a callback to reset the request state.
 */
export default function useExpandNode() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();
  const [_, setEntities] = useEntities();
  const { enqueueNotification, clearNotification } = useNotification();
  const remoteLogger = useRecoilValue(loggerSelector);

  const { isPending, mutate } = useMutation({
    mutationFn: async (
      expandNodeRequest: ExpandNodeRequest
    ): Promise<NeighborsResponse | null> => {
      // Calculate the expansion limit based on the connection limit and the request limit
      const limit = (() => {
        if (!explorer.connection.nodeExpansionLimit) {
          return expandNodeRequest.filters?.limit;
        }
        if (!expandNodeRequest.filters?.limit) {
          return explorer.connection.nodeExpansionLimit;
        }
        // If both exists then use the smaller of the two
        return Math.min(
          explorer.connection.nodeExpansionLimit,
          expandNodeRequest.filters.limit
        );
      })();

      // Perform the query when a request exists
      const request: NeighborsRequest | null = expandNodeRequest && {
        vertexId: expandNodeRequest.vertex.id,
        vertexType:
          expandNodeRequest.vertex.types?.join("::") ??
          expandNodeRequest.vertex.type,
        ...expandNodeRequest.filters,
        limit,
      };

      if (!explorer || !request) {
        return null;
      }

      return await explorer.fetchNeighbors(request);
    },
    onSuccess: data => {
      if (!data || !explorer) {
        return;
      }

      // Update the vertex and edge details caches
      updateVertexDetailsCache(explorer, queryClient, data.vertices);
      updateEdgeDetailsCache(explorer, queryClient, data.edges);

      // Update nodes and edges in the graph
      setEntities({
        nodes: toNodeMap(data.vertices),
        edges: toEdgeMap(data.edges),
      });
    },
    onError: error => {
      remoteLogger.error(`Failed to expand node: ${error.message}`);
      const displayError = createDisplayError(error);
      // Notify the user of the error
      enqueueNotification({
        title: "Expanding Node Failed",
        message: displayError.message,
        type: "error",
      });
    },
  });

  // Show a loading message to the user
  useEffect(() => {
    if (!isPending) {
      return;
    }
    const notificationId = enqueueNotification({
      title: "Expanding Node",
      message: "Expanding neighbors for the given node.",
      stackable: true,
    });

    return () => clearNotification(notificationId);
  }, [clearNotification, enqueueNotification, isPending]);

  // Build the expand node callback
  const neighborCallback = useNeighborsCallback();
  const expandNode = useCallback(
    async (vertex: Vertex, filters?: ExpandNodeFilters) => {
      const neighbor = await neighborCallback(vertex.id);
      if (!neighbor) {
        enqueueNotification({
          title: "No neighbor information available",
          message: "This vertex's neighbor data has not been retrieved yet.",
        });
        return;
      }
      const request: ExpandNodeRequest = {
        vertex,
        filters,
      };

      // Only allow expansion if we are not busy with another expansion
      if (isPending) {
        return;
      }

      if (neighbor.unfetched <= 0) {
        enqueueNotification({
          title: "No more neighbors",
          message:
            "This vertex has been fully expanded or it does not have connections",
        });
        return;
      }

      mutate(request);
    },
    [enqueueNotification, isPending, mutate, neighborCallback]
  );

  return {
    expandNode,
    isPending,
  };
}
