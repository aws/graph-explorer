import { useQuery, useQueryClient } from "react-query";
import { useNotification } from "../../components/NotificationProvider";
import { useConfiguration } from "../../core";
import useConnector from "../../core/ConnectorProvider/useConnector";
import usePrefixesUpdater from "../../hooks/usePrefixesUpdater";
import { useCallback, useMemo } from "react";
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

  const query = useQuery(
    queryKey,
    ({ signal }) => {
      if (!connector.explorer) {
        return;
      }

      const promise = connector.explorer.keywordSearch(
        {
          searchTerm: debouncedSearchTerm,
          vertexTypes,
          searchByAttributes,
          searchById: true,
          exactMatch,
        },
        { signal }
      );
      return promise;
    },
    {
      enabled: !!config && isOpen && !!connector.explorer,
      onSuccess: response => {
        if (!response) {
          return;
        }
        updatePrefixes(response.vertices.map(v => v.data.id));
      },
      onError: (e: Error) => {
        const displayError = createDisplayError(e);
        enqueueNotification({
          type: "error",
          ...displayError,
        });
      },
    }
  );

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
