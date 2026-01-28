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
 * Provides a combined `isFetching` status and `refreshSchema` function to refetch both queries.
 */
export function useSchemaSync() {
  const store = useStore();

  const schemaDiscoveryQuery = useQuery({
    ...schemaSyncQuery(),
    // Use the store directly to ensure it gets the latest value
    initialData: () => store.get(maybeActiveSchemaAtom),
    // Don't automatically run if the last schema sync failed
    enabled: () => {
      const schema = store.get(maybeActiveSchemaAtom);
      return !schema || !schema.lastSyncFail;
    },
  });

  // Derive edge types from the schema sync result to ensure consistency
  // This prevents the race condition where edge types are stale after schema deletion
  const schemaData = schemaDiscoveryQuery.data;
  const edges = schemaData?.edges.map(e => e.type) ?? [];

  // Disable edge connection query while schema sync is fetching to prevent
  // race conditions where edge types become stale after schema deletion
  const edgeConnectionEnabled =
    !schemaDiscoveryQuery.isFetching &&
    schemaData != null &&
    schemaData.edgeConnections == null;

  const edgeDiscoveryQuery = useQuery({
    ...edgeConnectionsQuery(edges),
    initialData: schemaDiscoveryQuery.data?.edgeConnections,
    enabled: edgeConnectionEnabled,
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
