import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";

import { schemaSyncQuery } from "@/connector";
import { useActiveSchema } from "@/core";
import { logger } from "@/utils";

export function useIsSyncing() {
  return useIsFetching({ queryKey: ["schema"] }) > 0;
}

export function useCancelSchemaSync() {
  const queryClient = useQueryClient();
  return () => {
    logger.debug("Cancelling schema sync query...");
    return queryClient.cancelQueries({ queryKey: ["schema"] });
  };
}

export function useSchemaSync() {
  const schema = useActiveSchema();

  // Check if the schema has ever been properly synced before providing initial data
  const initialData =
    schema && schema.lastUpdate && schema.triedToSync ? schema : undefined;

  const query = useQuery({
    ...schemaSyncQuery(),
    initialData: initialData,
    enabled: !initialData || schema?.lastSyncFail === true,
  });
  const { data, isFetching, error, refetch } = query;

  return { refetch, data, error, isFetching };
}
