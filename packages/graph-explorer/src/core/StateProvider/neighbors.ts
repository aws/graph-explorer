import { useDisplayVerticesInCanvas, VertexId } from "@/core";
import { atom, useAtomValue } from "jotai";
import { atomFamily, useAtomCallback } from "jotai/utils";
import { edgesAtom } from "./edges";
import { nodesAtom } from "./nodes";
import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bulkNeighborCountsQuery, neighborsCountQuery } from "@/connector";
import { useNotification } from "@/components/NotificationProvider";

export type NeighborCounts = {
  all: number;
  fetched: number;
  unfetched: number;
  byType: Map<string, { all: number; fetched: number; unfetched: number }>;
};

const defaultNeighborCounts: NeighborCounts = {
  all: 0,
  fetched: 0,
  unfetched: 0,
  byType: new Map(),
};

/** Represents the minimum information needed about a neighbor to calculate the neighbor counts. */
export type NeighborStub = {
  id: VertexId;
  types: string[];
};

/**
 * Provides a callback to fetch the neighbor counts for a given vertex.
 * @returns The neighbor counts for the given vertex.
 */
export function useNeighborsCallback() {
  const queryClient = useQueryClient();

  return useAtomCallback(
    useCallback(
      async (get, _set, vertexId: VertexId) => {
        const fetchedNeighbors = get(fetchedNeighborsSelector(vertexId));
        const response = await queryClient.fetchQuery(
          neighborsCountQuery(vertexId)
        );

        const neighbors = calculateNeighbors(
          response.totalCount,
          new Map(Object.entries(response.counts)),
          fetchedNeighbors
        );

        return neighbors;
      },
      [queryClient]
    )
  );
}

/**
 * Provides the neighbor counts for a given vertex ID.
 * @param vertexId The vertex ID for which to fetch the neighbor counts.
 * @returns The neighbor counts for the given vertex.
 */
export function useNeighbors(vertexId: VertexId) {
  const fetchedNeighbors = useAtomValue(fetchedNeighborsSelector(vertexId));
  const query = useQuery(neighborsCountQuery(vertexId));

  if (!query.data) {
    return defaultNeighborCounts;
  }

  const neighbors = calculateNeighbors(
    query.data.totalCount,
    new Map(Object.entries(query.data.counts)),
    fetchedNeighbors
  );

  return neighbors;
}

/**
 * Provides the neighbor counts for a given vertex ID and neighbor type.
 * @param vertexId The vertex ID for which to fetch the neighbors counts.
 * @param type The neighbor type for which to fetch the neighbors counts.
 * @returns The neighbor counts for the given vertex and neighbor type.
 */
export function useNeighborByType(vertexId: VertexId, type: string) {
  const neighbors = useNeighbors(vertexId)?.byType.get(type);
  if (!neighbors) {
    return { all: 0, fetched: 0, unfetched: 0 };
  }
  return neighbors;
}

export function useAllNeighbors() {
  const vertices = useDisplayVerticesInCanvas();
  const vertexIds = useMemo(() => vertices.keys().toArray(), [vertices]);

  const queryClient = useQueryClient();
  const fetchedNeighbors = useAtomValue(allFetchedNeighborsSelector(vertexIds));
  const { isLoading, error, data } = useQuery(
    bulkNeighborCountsQuery(vertexIds, queryClient)
  );

  const { enqueueNotification, clearNotification } = useNotification();

  // Show loading notification
  useEffect(() => {
    if (!isLoading) {
      return;
    }
    const notificationId = enqueueNotification({
      title: "Updating Neighbors",
      message: `Updating neighbor counts for new nodes`,
      autoHideDuration: null,
    });
    return () => clearNotification(notificationId);
  }, [clearNotification, isLoading, enqueueNotification]);

  // Show error notification
  useEffect(() => {
    if (isLoading || !error) {
      return;
    }
    const notificationId = enqueueNotification({
      title: "Some Errors Occurred",
      message: `While requesting counts for neighboring nodes, some errors occurred.`,
      type: "error",
    });
    return () => clearNotification(notificationId);
  }, [clearNotification, isLoading, error, enqueueNotification]);

  return useMemo(() => {
    if (!data) {
      return new Map(vertexIds.map(id => [id, defaultNeighborCounts]));
    }

    return new Map(
      data
        .values()
        .filter(d => d != null)
        .map(data => {
          const neighbors = fetchedNeighbors.get(data.vertexId) ?? [];
          return [
            data.vertexId,
            calculateNeighbors(
              data.totalCount,
              new Map(Object.entries(data.counts)),
              neighbors
            ),
          ];
        })
    );
  }, [data, fetchedNeighbors, vertexIds]);
}

/**
 * Calculates the neighbor counts for a given vertex.
 * @param total The total number of neighbors.
 * @param totalByType The total number of neighbors by type.
 * @param fetchedNeighbors A list of neighbors that have been fetched.
 * @returns The neighbor counts for the given vertex.
 */
export function calculateNeighbors(
  total: number,
  totalByType: Map<string, number>,
  fetchedNeighbors: NeighborStub[]
): NeighborCounts {
  const fetchNeighborsMap = new Map(fetchedNeighbors.map(n => [n.id, n]));

  const fetchedTotal = fetchNeighborsMap.size;
  const totals = {
    all: total,
    fetched: fetchedTotal,
    unfetched: total - fetchedTotal,
  };

  const fetchedNeighborsByType = fetchNeighborsMap
    .values()
    .reduce((map, neighbor) => {
      // Uses the primary type until we can support neighbor counts in a multi-label world
      const type = neighbor.types[0] ?? "";
      const fetched = map.get(type) ?? 0;
      return map.set(type, fetched + 1);
    }, new Map<string, number>());

  const byType = new Map(
    totalByType.entries().map(([type, count]) => {
      // Count of unique neighbors that have been fetched
      const fetched = fetchedNeighborsByType.get(type) ?? 0;

      // Total neighbors minus the fetched neighbors
      const unfetched = count - fetched;

      return [
        type,
        {
          all: count,
          fetched,
          unfetched,
        },
      ];
    })
  );

  return {
    ...totals,
    byType,
  };
}

const fetchedNeighborsSelector = atomFamily((id: VertexId) =>
  atom(get => {
    const nodes = get(nodesAtom);
    const edges = get(edgesAtom);

    const neighbors = edges
      .values()
      .map(edge => {
        // Get all OUT connected edges: current node is source and target should exist
        if (edge.source === id && nodes.has(edge.target)) {
          return { id: edge.target, types: edge.targetTypes };
        }
        // Get all IN connected edges: current node is target and source should exist
        if (edge.target === id && nodes.has(edge.source)) {
          return { id: edge.source, types: edge.sourceTypes };
        }
        return null;
      })
      .filter(neighbor => neighbor !== null)
      .toArray();

    return neighbors;
  })
);

/**
 * Provides a callback for getting the unique set of neighbors for a given vertex ID.
 * @returns A callback that returns the unique set of neighbors for a given vertex ID.
 */
export function useFetchedNeighborsCallback() {
  const nodes = useAtomValue(nodesAtom);
  const edges = useAtomValue(edgesAtom);

  return (id: VertexId) =>
    new Set(
      edges
        .values()
        // Find edges matching the given vertex ID
        .filter(edge => edge.source === id || edge.target === id)
        // Filter out edges where the source or target vertex is not in the graph
        .filter(edge => nodes.has(edge.source) && nodes.has(edge.target))
        // Get the source or target vertex ID depending on the edge direction
        .map(edge => (edge.source === id ? edge.target : edge.source))
    );
}

const allFetchedNeighborsSelector = atomFamily((ids: VertexId[]) =>
  atom(get => {
    return new Map(ids.map(id => [id, get(fetchedNeighborsSelector(id))]));
  })
);
