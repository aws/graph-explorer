import { useCallback, useEffect } from "react";
import { useNotification } from "@/components/NotificationProvider";
import {
  updateEdgeDetailsCache,
  updateVertexDetailsCache,
  type NeighborsRequest,
  type NeighborsResponse,
} from "@/connector";
import { loggerSelector, useExplorer } from "@/core/connector";
import { useRecoilValue } from "recoil";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Vertex, VertexId } from "@/core";
import { createDisplayError } from "@/utils/createDisplayError";
import { useNeighborsCallback } from "@/core";
import { useAddToGraph } from "./useAddToGraph";

export type ExpandNodeFilters = Omit<
  NeighborsRequest,
  "vertexId" | "vertexTypes"
>;

export type ExpandNodeRequest = {
  vertexId: NeighborsRequest["vertexId"];
  vertexTypes: NeighborsRequest["vertexTypes"];
  filters?: ExpandNodeFilters;
};

/**
 * Provides a callback to submit a node expansion request, the query
 * information, and a callback to reset the request state.
 */
export default function useExpandNode() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();
  const addToGraph = useAddToGraph();
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
        vertexId: expandNodeRequest.vertexId,
        vertexTypes: expandNodeRequest.vertexTypes,
        ...expandNodeRequest.filters,
        limit,
      };

      if (!request) {
        return null;
      }

      return await explorer.fetchNeighbors(request);
    },
    onSuccess: data => {
      if (!data) {
        return;
      }

      // Update the vertex and edge details caches
      updateVertexDetailsCache(explorer, queryClient, data.vertices);
      updateEdgeDetailsCache(explorer, queryClient, data.edges);

      // Update nodes and edges in the graph
      addToGraph(data);
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
    async (
      vertexId: VertexId,
      vertexTypes: Vertex["types"],
      filters?: ExpandNodeFilters
    ) => {
      const neighbor = await neighborCallback(vertexId);
      if (!neighbor) {
        enqueueNotification({
          title: "No neighbor information available",
          message: "This vertex's neighbor data has not been retrieved yet.",
        });
        return;
      }
      const request: ExpandNodeRequest = {
        vertexId,
        vertexTypes,
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
