import { VertexId } from "@/@types/entities";
import { selectorFamily, useRecoilCallback, useRecoilValue } from "recoil";
import { edgesAtom } from "./edges";
import { nodesAtom } from "./nodes";
import {
  useAllNeighborCountsQuery,
  useUpdateNodeCountsQuery,
} from "@/hooks/useUpdateNodeCounts";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { neighborsCountQuery } from "@/connector/queries";
import { activeConnectionSelector, explorerSelector } from "../connector";
import { VertexRef } from "@/connector/useGEFetchTypes";

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
  type: string;
};

/**
 * Provides a callback to fetch the neighbor counts for a given vertex.
 * @param id The vertex id for which to fetch the neighbor counts.
 * @returns The neighbor counts for the given vertex.
 */
export function useNeighborsCallback() {
  const queryClient = useQueryClient();

  return useRecoilCallback(({ snapshot }) => async (vertex: VertexRef) => {
    const fetchedNeighbors = await snapshot.getPromise(
      fetchedNeighborsSelector(vertex.id)
    );
    const explorer = await snapshot.getPromise(explorerSelector);
    const connection = await snapshot.getPromise(activeConnectionSelector);
    const response = await queryClient.ensureQueryData(
      neighborsCountQuery(vertex, connection?.nodeExpansionLimit, explorer)
    );

    const neighbors = calculateNeighbors(
      response.totalCount,
      new Map(Object.entries(response.counts)),
      fetchedNeighbors
    );

    return neighbors;
  });
}

/**
 * Provides the neighbor counts for a given vertex.
 * @param id The vertex id for which to fetch the neighbor counts.
 * @returns The neighbor counts for the given vertex.
 */
export function useNeighbors(vertex: VertexRef) {
  const fetchedNeighbors = useRecoilValue(fetchedNeighborsSelector(vertex.id));
  const query = useUpdateNodeCountsQuery(vertex);

  return useMemo(() => {
    if (!query.data) {
      return defaultNeighborCounts;
    }

    const neighbors = calculateNeighbors(
      query.data.totalCount,
      new Map(Object.entries(query.data.counts)),
      fetchedNeighbors
    );

    return neighbors;
  }, [query.data, fetchedNeighbors]);
}

/**
 * Provides the neighbor counts for a given vertex and neighbor type.
 * @param id The vertex id for which to fetch the neighbors counts.
 * @param type The neighbor type for which to fetch the neighbors counts.
 * @returns The neighbor counts for the given vertex and neighbor type.
 */
export function useNeighborByType(vertex: VertexRef, type: string) {
  const neighbors = useNeighbors(vertex)?.byType.get(type);
  if (!neighbors) {
    return { all: 0, fetched: 0, unfetched: 0 };
  }
  return neighbors;
}

export function useAllNeighbors(vertices: VertexRef[]) {
  const fetchedNeighbors = useRecoilValue(
    allFetchedNeighborsSelector(vertices.map(v => v.id))
  );
  const query = useAllNeighborCountsQuery(vertices);

  const results = new Map(
    query
      .values()
      .map(q => q.data)
      .filter(d => d != null)
      .map(data => {
        const neighbors = fetchedNeighbors.get(data.nodeId) ?? [];
        return [
          data.nodeId,
          calculateNeighbors(
            data.totalCount,
            new Map(Object.entries(data.counts)),
            neighbors
          ),
        ];
      })
  );

  return results;
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
  const fetchedTotal = new Set(fetchedNeighbors.map(n => n.id)).size;
  const totals = {
    all: total,
    fetched: fetchedTotal,
    unfetched: total - fetchedTotal,
  };

  const fetchedNeighborsByType = Map.groupBy(fetchedNeighbors, n => n.type);

  const byType = new Map(
    totalByType.entries().map(([type, count]) => {
      // Count of unique neighbors that have been fetched
      const fetched = new Set(fetchedNeighborsByType.get(type)?.map(n => n.id))
        .size;

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

const fetchedNeighborsSelector = selectorFamily({
  key: "fetched-neighbors",
  get:
    (id: VertexId) =>
    ({ get }) => {
      const nodes = get(nodesAtom);
      const edges = get(edgesAtom);

      const neighbors = edges
        .values()
        .map(edge => {
          // Get all OUT connected edges: current node is source and target should exist
          if (edge.source === id && nodes.has(edge.target)) {
            return { id: edge.target, type: edge.targetType };
          }
          // Get all IN connected edges: current node is target and source should exist
          if (edge.target === id && nodes.has(edge.source)) {
            return { id: edge.source, type: edge.sourceType };
          }
          return null;
        })
        .filter(neighbor => neighbor !== null)
        .toArray();

      return neighbors;
    },
});

const allFetchedNeighborsSelector = selectorFamily({
  key: "all-fetched-neighbors",
  get:
    (ids: VertexId[]) =>
    ({ get }) => {
      return new Map(ids.map(id => [id, get(fetchedNeighborsSelector(id))]));
    },
});
