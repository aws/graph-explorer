import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../../components/NotificationProvider";
import { useConfiguration } from "../../core";
import useConnector from "../../core/ConnectorProvider/useConnector";
import usePrefixesUpdater from "../../hooks/usePrefixesUpdater";
import { useCallback, useEffect, useMemo } from "react";
import { createDisplayError } from "../../utils/createDisplayError";

export type SearchQueryRequest = {
  debouncedSearchTerm: string;
  vertexTypes?: string[];
  searchByAttributes: string[];
  exactMatch: boolean;
  neighborsLimit: boolean;
  isOpen: boolean;
};

export function useKeywordSearchQuery({
  debouncedSearchTerm,
  vertexTypes,
  searchByAttributes,
  exactMatch,
  neighborsLimit,
  isOpen,
}: SearchQueryRequest) {
  const config = useConfiguration();
  const connector = useConnector();
  const updatePrefixes = usePrefixesUpdater();
  const { enqueueNotification } = useNotification();
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => [
      "keyword-search",
      debouncedSearchTerm,
      vertexTypes,
      searchByAttributes,
      exactMatch,
      neighborsLimit,
    ],
    [
      debouncedSearchTerm,
      vertexTypes,
      searchByAttributes,
      exactMatch,
      neighborsLimit,
    ]
  );

  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!connector.explorer) {
        return;
      }

      return await connector.explorer.keywordSearch(
        {
          searchTerm: debouncedSearchTerm,
          vertexTypes,
          searchByAttributes,
          searchById: true,
          exactMatch,
        },
        { signal }
      );
    },
    enabled: !!config && isOpen && !!connector.explorer,
  });

  // Sync sparql prefixes
  useEffect(() => {
    if (!query.data) {
      return;
    }
    updatePrefixes(query.data.vertices.map(v => v.data.id));
  }, [query.data, updatePrefixes]);

  // Show errors
  useEffect(() => {
    if (!query.error) {
      return;
    }
    const displayError = createDisplayError(query.error);
    enqueueNotification({
      type: "error",
      ...displayError,
    });
  }, [query.error, enqueueNotification]);

  const cancelAll = useCallback(async () => {
    await queryClient.cancelQueries({
      queryKey: ["keyword-search"],
      exact: false,
    });
  }, [queryClient]);

  return {
    ...query,
    cancelAll,
  };
}
