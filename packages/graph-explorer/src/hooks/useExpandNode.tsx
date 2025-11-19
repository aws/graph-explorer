import { useNotification } from "@/components/NotificationProvider";
import {
  setEdgeDetailsQueryCache,
  setVertexDetailsQueryCache,
  type NeighborsRequest,
  type NeighborsResponse,
} from "@/connector";
import { loggerSelector, useExplorer } from "@/core/connector";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useFetchedNeighborsCallback,
  useNeighborsCallback,
  activeConnectionAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
} from "@/core";
import { createDisplayError } from "@/utils/createDisplayError";
import { useAddToGraph } from "./useAddToGraph";
import { atom, useAtomValue } from "jotai";

export type ExpandNodeFilters = Omit<
  NeighborsRequest,
  "vertexId" | "vertexTypes" | "excludedVertices"
>;

const defaultExpansionLimitAtom = atom(get => {
  // Check for a connection override
  const connection = get(activeConnectionAtom);
  if (connection && connection.nodeExpansionLimit) {
    return connection.nodeExpansionLimit;
  }

  // Check for a default limit
  const defaultLimitEnabled = get(defaultNeighborExpansionLimitEnabledAtom);
  const defaultLimit = get(defaultNeighborExpansionLimitAtom);

  return defaultLimitEnabled ? defaultLimit : null;
});

/** Returns the default neighbor expansion limit if it is enabled. */
export function useDefaultNeighborExpansionLimit() {
  return useAtomValue(defaultExpansionLimitAtom);
}

/**
 * Provides a callback to submit a node expansion request, the query
 * information, and a callback to reset the request state.
 */
export default function useExpandNode() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();
  const addToGraph = useAddToGraph();
  const getFetchedNeighbors = useFetchedNeighborsCallback();
  const { enqueueNotification, clearNotification } = useNotification();
  const remoteLogger = useAtomValue(loggerSelector);
  const neighborCallback = useNeighborsCallback();
  const notificationTitle = "Expanding Node";

  const { isPending, mutate } = useMutation({
    scope: {
      // Enforces only one expand node mutation is executed at a time
      id: "expandNode",
    },
    mutationFn: async (
      request: NeighborsRequest,
    ): Promise<NeighborsResponse | null> => {
      const neighbor = await neighborCallback(request.vertexId);
      if (!neighbor) {
        enqueueNotification({
          title: "No neighbor information available",
          message: "This vertex's neighbor data has not been retrieved yet.",
        });
        return null;
      }

      if (neighbor.unfetched <= 0) {
        enqueueNotification({
          title: "No more neighbors",
          message:
            "This vertex has been fully expanded or it does not have connections",
        });
        return null;
      }

      // Show progress
      const progressNotificationId = enqueueNotification({
        title: notificationTitle,
        message: "Expanding neighbors for the given node.",
        type: "loading",
        autoHideDuration: null,
      });

      try {
        // Get neighbors that have already been added so they can be excluded
        const excludedNeighbors = getFetchedNeighbors(request.vertexId);

        // Perform the query when a request exists
        const result = await explorer.fetchNeighbors({
          ...request,
          excludedVertices: excludedNeighbors,
        });

        // Update the vertex and edge details caches
        result.vertices.forEach(v =>
          setVertexDetailsQueryCache(queryClient, v),
        );
        result.edges.forEach(e => setEdgeDetailsQueryCache(queryClient, e));

        // Update nodes and edges in the graph
        await addToGraph(result);

        return result;
      } catch (error) {
        remoteLogger.error(
          `Failed to expand node: ${(error as Error)?.message ?? "Unknown error"}`,
        );
        const displayError = createDisplayError(error);
        // Notify the user of the error
        enqueueNotification({
          title: "Expanding Node Failed",
          message: displayError.message,
          type: "error",
        });
        throw error;
      } finally {
        clearNotification(progressNotificationId);
      }
    },
  });

  return {
    expandNode: mutate,
    isPending,
  };
}
