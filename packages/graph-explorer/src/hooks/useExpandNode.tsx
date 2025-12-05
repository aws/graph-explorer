import { toast } from "sonner";
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
  type VertexId,
  type Vertex,
  type Edge,
} from "@/core";
import { createDisplayError } from "@/utils/createDisplayError";
import { useAddToGraph } from "./useAddToGraph";
import { atom, useAtomValue } from "jotai";
import { getExplorer } from "@/connector/queries/helpers";

export type ExpandNodeFilters = Omit<
  NeighborsRequest,
  "vertexId" | "vertexTypes" | "excludedVertices"
>;

export type ExpandNodesRequest = ExpandNodeFilters & {
  vertexIds: VertexId[];
};

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
  const remoteLogger = useAtomValue(loggerSelector);
  const neighborCallback = useNeighborsCallback();

  // Expand single node
  const { isPending: isExpandingSingle, mutate: expandNode } = useMutation({
    scope: {
      // Enforces only one expand node mutation is executed at a time
      id: "expandNode",
    },
    mutationFn: async (request: NeighborsRequest, { client, meta }) => {
      const explorer = getExplorer(meta);

      const expandPromise = fetchNeighbors(
        request,
        explorer,
        neighborCallback,
        getFetchedNeighbors,
      );

      toast.promise(expandPromise, {
        loading: "Expanding neighbors",
        error: err => {
          remoteLogger.error(
            `Failed to expand node: ${(err as Error)?.message ?? "Unknown error"}`,
          );
          const displayError = createDisplayError(err);
          return displayError.message;
        },
      });

      const result = await expandPromise;

      // No neighbors to add
      if (result.vertices.length + result.edges.length <= 0) {
        toast.info("No more neighbors to expand");
        return;
      }

      // Update the vertex and edge details caches
      result.vertices.forEach(v => setVertexDetailsQueryCache(client, v));
      result.edges.forEach(e => setEdgeDetailsQueryCache(client, e));

      // Update nodes and edges in the graph
      await addToGraph(result);
      return;
    },
  });

  // Expand multiple nodes in parallel
  const { isPending: isExpandingMultiple, mutate: expandNodes } = useMutation({
    scope: {
      id: "expandNode",
    },
    mutationFn: async (request: ExpandNodesRequest, { client, meta }) => {
      const explorer = getExplorer(meta);
      const { vertexIds, ...filters } = request;

      const expandPromise = (async () => {
        // Fetch neighbors for all vertices in parallel
        const results = await Promise.all(
          vertexIds.map(vertexId =>
            fetchNeighbors(
              { vertexId, ...filters },
              explorer,
              neighborCallback,
              getFetchedNeighbors,
            ),
          ),
        );

        // Combine all results & update cache
        const combinedVertices: Vertex[] = [];
        const combinedEdges: Edge[] = [];

        for (const result of results) {
          for (const vertex of result.vertices) {
            combinedVertices.push(vertex);
            setVertexDetailsQueryCache(client, vertex);
          }

          for (const edge of result.edges) {
            combinedEdges.push(edge);
            setEdgeDetailsQueryCache(client, edge);
          }
        }

        return {
          vertices: combinedVertices,
          edges: combinedEdges,
        };
      })();

      toast.promise(expandPromise, {
        loading: `Expanding neighbors`,
        error: err => {
          remoteLogger.error(
            `Failed to expand nodes: ${(err as Error)?.message ?? "Unknown error"}`,
          );
          const displayError = createDisplayError(err);
          return displayError.message;
        },
      });

      const combined = await expandPromise;

      if (combined.vertices.length + combined.edges.length <= 0) {
        toast.info("No more neighbors to expand");
        return;
      }

      await addToGraph(combined);

      return combined;
    },
  });

  return {
    expandNode,
    expandNodes,
    isPending: isExpandingSingle || isExpandingMultiple,
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
