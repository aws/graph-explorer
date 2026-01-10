import type { VertexId, VertexType } from "@/core";
import { atom, useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { atomFamily } from "jotai-family";
import { edgesAtom } from "./edges";
import { nodesAtom, toNodeMap } from "./nodes";
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bulkNeighborCountsQuery, neighborsCountQuery } from "@/connector";

export type NeighborCounts = {
  all: number;
  fetched: number;
  unfetched: number;
  byType: Map<VertexType, { all: number; fetched: number; unfetched: number }>;
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
          neighborsCountQuery(vertexId),
        );

        const neighbors = calculateNeighbors(
          response.totalCount,
          response.counts,
          fetchedNeighbors,
        );

        return neighbors;
      },
      [queryClient],
    ),
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
    query.data.counts,
    fetchedNeighbors,
  );

  return neighbors;
}

/**
 * Provides the neighbor counts for a given vertex ID and neighbor type.
 * @param vertexId The vertex ID for which to fetch the neighbors counts.
 * @param type The neighbor type for which to fetch the neighbors counts.
 * @returns The neighbor counts for the given vertex and neighbor type.
 */
export function useNeighborByType(vertexId: VertexId, type: VertexType) {
  const neighbors = useNeighbors(vertexId)?.byType.get(type);
  if (!neighbors) {
    return { all: 0, fetched: 0, unfetched: 0 };
  }
  return neighbors;
}

export function useAllNeighbors() {
  const vertices = useAtomValue(nodesAtom);
  const vertexIds = useMemo(() => vertices.keys().toArray(), [vertices]);

  const queryClient = useQueryClient();
  const fetchedNeighbors = useAtomValue(allFetchedNeighborsSelector(vertexIds));
  const { data } = useQuery(bulkNeighborCountsQuery(vertexIds, queryClient));

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
            calculateNeighbors(data.totalCount, data.counts, neighbors),
          ];
        }),
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
  totalByType: Map<VertexType, number>,
  fetchedNeighbors: NeighborStub[],
): NeighborCounts {
  const fetchNeighborsMap = new Map(fetchedNeighbors.map(n => [n.id, n]));

  const fetchedTotal = fetchNeighborsMap.size;
  const totals = {
    all: total,
    fetched: fetchedTotal,
    unfetched: Math.max(0, total - fetchedTotal),
  };

  const fetchedNeighborsByType = fetchNeighborsMap
    .values()
    .reduce((map, neighbor) => {
      for (const type of neighbor.types) {
        map.set(type, (map.get(type) ?? 0) + 1);
      }
      return map;
    }, new Map<string, number>());

  const byType = new Map(
    totalByType.entries().map(([type, count]) => {
      // Count of unique neighbors that have been fetched
      const fetched = fetchedNeighborsByType.get(type) ?? 0;

      // Total neighbors minus the fetched neighbors
      const unfetched = Math.max(0, count - fetched);

      return [
        type,
        {
          all: count,
          fetched,
          unfetched,
        },
      ];
    }),
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

    const neighbors = toNodeMap([]);

    for (const edge of edges.values()) {
      // This edge is not related to the given vertex id
      if (id !== edge.sourceId && id !== edge.targetId) {
        continue;
      }

      const neighborId = edge.sourceId === id ? edge.targetId : edge.sourceId;
      const neighbor = nodes.get(neighborId);

      if (!neighbor) {
        // The neighbor is not in the graph
        continue;
      }

      neighbors.set(neighbor.id, neighbor);
    }

    return neighbors.values().toArray();
  }),
);

/**
 * Provides a callback for getting the unique set of neighbors for a given vertex ID.
 * @returns A callback that returns the unique set of neighbors for a given vertex ID.
 */
export function useFetchedNeighborsCallback() {
  return useAtomCallback(
    useCallback(
      (get, _set, vertexId: VertexId) => get(fetchedNeighborIdsAtom(vertexId)),
      [],
    ),
  );
}

const fetchedNeighborIdsAtom = atomFamily((id: VertexId) =>
  atom(get => {
    const neighbors = get(fetchedNeighborsSelector(id));
    return new Set(neighbors.map(n => n.id));
  }),
);

const allFetchedNeighborsSelector = atomFamily((ids: VertexId[]) =>
  atom(get => {
    return new Map(ids.map(id => [id, get(fetchedNeighborsSelector(id))]));
  }),
);
