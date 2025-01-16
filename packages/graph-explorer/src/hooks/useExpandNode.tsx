import { useCallback, useEffect } from "react";
import { useNotification } from "@/components/NotificationProvider";
import type { NeighborsRequest, NeighborsResponse } from "@/connector";
import {
  activeConnectionSelector,
  explorerSelector,
  loggerSelector,
} from "@/core/connector";
import useEntities from "./useEntities";
import { useRecoilValue } from "recoil";
import { useMutation } from "@tanstack/react-query";
import { Vertex } from "@/types/entities";
import { createDisplayError } from "@/utils/createDisplayError";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";
import { useNeighborsCallback } from "@/core";

type ExpandNodeFilters = Omit<NeighborsRequest, "vertex" | "vertexType">;

export type ExpandNodeRequest = {
  vertex: Vertex;
  filters?: ExpandNodeFilters;
};

/**
 * Provides a callback to submit a node expansion request, the query
 * information, and a callback to reset the request state.
 */
export default function useExpandNode() {
  const explorer = useRecoilValue(explorerSelector);
  const [_, setEntities] = useEntities();
  const { enqueueNotification, clearNotification } = useNotification();
  const remoteLogger = useRecoilValue(loggerSelector);

  const { isPending, mutate } = useMutation({
    mutationFn: async (
      expandNodeRequest: ExpandNodeRequest
    ): Promise<NeighborsResponse | null> => {
      // Perform the query when a request exists
      const request: NeighborsRequest | null = expandNodeRequest && {
        vertex: expandNodeRequest.vertex,
        vertexType:
          expandNodeRequest.vertex.types?.join("::") ??
          expandNodeRequest.vertex.type,
        ...expandNodeRequest.filters,
      };

      if (!explorer || !request) {
        return null;
      }

      return await explorer.fetchNeighbors(request);
    },
    onSuccess: data => {
      if (!data) {
        return;
      }
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
    // const displayName = getDisplayNames(expandNodeRequest.vertex);
    const notificationId = enqueueNotification({
      title: "Expanding Node",
      // message: `Expanding the node ${displayName.name}`,
      message: "Expanding neighbors for the given node.",
      stackable: true,
    });

    return () => clearNotification(notificationId);
  }, [clearNotification, enqueueNotification, isPending]);

  // Build the expand node callback
  const connection = useRecoilValue(activeConnectionSelector);
  const neighborCallback = useNeighborsCallback();
  const expandNode = useCallback(
    async (vertex: Vertex, filters?: ExpandNodeFilters) => {
      const neighbor = await neighborCallback(vertex);
      if (!neighbor) {
        enqueueNotification({
          title: "No neighbor information available",
          message: "This vertex's neighbor data has not been retrieved yet.",
        });
        return;
      }
      const request: ExpandNodeRequest = {
        vertex,
        filters: {
          ...filters,
          limit: filters?.limit || connection?.nodeExpansionLimit,
        },
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
    [
      connection?.nodeExpansionLimit,
      enqueueNotification,
      isPending,
      mutate,
      neighborCallback,
    ]
  );

  return {
    expandNode,
    isPending,
  };
}
