import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "jotai";

import { edgeConnectionsQuery, schemaSyncQuery } from "@/connector";
import { maybeActiveSchemaAtom } from "@/core";
import { logger } from "@/utils";

/** Returns true if any schema sync query is running. Will not trigger the query to run. */
export function useIsSyncing() {
  return useIsFetching({ queryKey: ["schema"] }) > 0;
}

/** Returns a function that cancels all in-flight schema sync queries. */
export function useCancelSchemaSync() {
  const queryClient = useQueryClient();
  return () => {
    logger.log("Cancelling schema sync");
    return queryClient.cancelQueries({ queryKey: ["schema"] });
  };
}

/**
 * Subscribes to the schema discovery and edge connection discovery queries.
 *
 * Both queries use `staleTime: Infinity` and `initialData` from the Jotai
 * store. This means:
 * - If cached data exists in localforage, it seeds the query cache and no
 *   fetch occurs.
 * - If no cached data exists, TanStack Query fetches automatically.
 * - Manual refetch is available via `refreshSchema()`.
 * - On refetch failure, TanStack Query preserves the previous successful data.
 */
export function useSchemaSync() {
  const store = useStore();

  const schemaDiscoveryQuery = useQuery({
    ...schemaSyncQuery(),
    initialData: () => store.get(maybeActiveSchemaAtom),
    // Don't automatically retry if the last sync failed (persisted across sessions)
    enabled: () => !store.get(maybeActiveSchemaAtom)?.lastSyncFail,
  });

  // Derive edge types from the schema sync result to ensure consistency
  const schemaData = schemaDiscoveryQuery.data;
  const edges = schemaData?.edges.map(e => e.type) ?? [];

  const edgeDiscoveryQuery = useQuery({
    ...edgeConnectionsQuery(edges),
    // Wait for schema sync to finish before fetching edge connections.
    // Don't automatically retry if the last edge connection sync failed.
    enabled:
      !schemaDiscoveryQuery.isFetching &&
      schemaData != null &&
      !store.get(maybeActiveSchemaAtom)?.lastEdgeConnectionSyncFail,
    initialData: () => {
      const edgeConnections = store.get(maybeActiveSchemaAtom)?.edgeConnections;
      if (edgeConnections == null) {
        return undefined;
      }
      const edgeTypeSet = new Set(edges);
      return edgeConnections.filter(ec => edgeTypeSet.has(ec.edgeType));
    },
  });

  const isFetching =
    schemaDiscoveryQuery.isFetching || edgeDiscoveryQuery.isFetching;

  const refreshSchema = async () => {
    logger.log("Refreshing schema");
    await schemaDiscoveryQuery.refetch();
    await edgeDiscoveryQuery.refetch();
  };

  return {
    /** Query state for schema discovery */
    schemaDiscoveryQuery,
    /** Query state for edge connection discovery */
    edgeDiscoveryQuery,
    /** Refetches both schema and edge connections */
    refreshSchema,
    /** True if either query is fetching */
    isFetching,
  };
}
