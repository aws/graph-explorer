import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";

import { schemaSyncQuery } from "@/connector";
import { useMaybeActiveSchema } from "@/core";
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
  const schema = useMaybeActiveSchema();

  const query = useQuery({
    ...schemaSyncQuery(),
    initialData: schema,
  });
  return query;
}
