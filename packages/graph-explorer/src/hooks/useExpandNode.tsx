import { useNotification } from "@/components/NotificationProvider";
import {
  setEdgeDetailsQueryCache,
  setVertexDetailsQueryCache,
  type Explorer,
  type NeighborsRequest,
} from "@/connector";
import { loggerSelector } from "@/core/connector";
import { useMutation } from "@tanstack/react-query";
import {
  useFetchedNeighborsCallback,
  useNeighborsCallback,
  activeConnectionAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  type Entities,
} from "@/core";
import { createDisplayError } from "@/utils/createDisplayError";
import { useAddToGraph } from "./useAddToGraph";
import { atom, useAtomValue } from "jotai";
import { getExplorer } from "@/connector/queries/helpers";

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
  const addToGraph = useAddToGraph();
  const getFetchedNeighbors = useFetchedNeighborsCallback();
  const { enqueueNotification, clearNotification } = useNotification();
  const remoteLogger = useAtomValue(loggerSelector);
  const neighborCallback = useNeighborsCallback();

  // Expand single node
  const { isPending, mutate: expandNode } = useMutation({
    scope: {
      // Enforces only one expand node mutation is executed at a time
      id: "expandNode",
    },
    mutationFn: async (request: NeighborsRequest, { client, meta }) => {
      const explorer = getExplorer(meta);
      const notificationTitle = "Expanding Node";

      // Show progress
      const progressNotificationId = enqueueNotification({
        title: notificationTitle,
        message: "Expanding neighbors for the given node.",
        type: "loading",
        autoHideDuration: null,
      });

      try {
        const result = await fetchNeighbors(
          request,
          explorer,
          neighborCallback,
          getFetchedNeighbors,
        );

        // Exit early and tell the user there are no neighbors
        if (result.vertices.length + result.edges.length <= 0) {
          enqueueNotification({
            title: "No more neighbors",
            message:
              "This vertex has been fully expanded or it does not have connections",
          });
          return;
        }

        // Update the vertex and edge details caches
        result.vertices.forEach(v => setVertexDetailsQueryCache(client, v));
        result.edges.forEach(e => setEdgeDetailsQueryCache(client, e));

        // Update nodes and edges in the graph
        await addToGraph(result);
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
    expandNode,
    isPending,
  };
}

async function fetchNeighbors(
  request: NeighborsRequest,
  explorer: Explorer,
  neighborCallback: ReturnType<typeof useNeighborsCallback>,
  getFetchedNeighbors: ReturnType<typeof useFetchedNeighborsCallback>,
) {
  const neighbor = await neighborCallback(request.vertexId);

  if (neighbor.unfetched <= 0) {
    return {
      vertices: [],
      edges: [],
    } satisfies Entities;
  }

  // Get neighbors that have already been added so they can be excluded
  const excludedNeighbors = getFetchedNeighbors(request.vertexId);

  // Perform the query when a request exists
  const result = await explorer.fetchNeighbors({
    ...request,
    excludedVertices: excludedNeighbors,
  });

  return result;
}
