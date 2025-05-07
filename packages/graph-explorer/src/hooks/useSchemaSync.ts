import { useEffect } from "react";
import { useResolvedConfig } from "@/core/ConfigurationProvider";
import { useExplorer } from "@/core/connector";
import useUpdateSchema from "./useUpdateSchema";
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { schemaSyncQuery } from "@/connector";

export function useIsSyncing() {
  return useIsFetching({ queryKey: ["schema"] }) > 0;
}

export function useCancelSchemaSync() {
  const queryClient = useQueryClient();
  const { replaceSchema } = useUpdateSchema();
  const explorer = useExplorer();
  return () =>
    queryClient.cancelQueries(schemaSyncQuery(replaceSchema, explorer));
}

export function useSchemaSync() {
  const config = useResolvedConfig();
  const explorer = useExplorer();

  const { replaceSchema, setSyncFailure } = useUpdateSchema();

  // Check if the schema has ever been properly synced before providing initial data
  const initialData =
    config.schema && config.schema.lastUpdate && config.schema.triedToSync
      ? config.schema
      : undefined;

  const query = useQuery({
    ...schemaSyncQuery(replaceSchema, explorer),
    initialData: initialData,
    enabled: !initialData || config.schema?.lastSyncFail === true,
  });
  const { data, isFetching, status, error, refetch } = query;

  // If the schema sync fails, set the schema to a failed state
  useEffect(() => {
    if (status === "error") {
      setSyncFailure();
    }
  }, [setSyncFailure, status]);

  return { refetch, data, error, isFetching };
}
