import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../../components/NotificationProvider";
import { explorerSelector } from "../../core/connector";
import usePrefixesUpdater from "../../hooks/usePrefixesUpdater";
import { useCallback, useEffect } from "react";
import { createDisplayError } from "../../utils/createDisplayError";
import { useRecoilValue } from "recoil";
import { searchQuery } from "../../connector/queries";
import { KeywordSearchRequest } from "../../connector/useGEFetchTypes";

export type SearchQueryRequest = {
  debouncedSearchTerm: string;
  vertexTypes?: string[];
  searchByAttributes: string[];
  exactMatch: boolean;
  isOpen: boolean;
};

export function useKeywordSearchQuery({
  debouncedSearchTerm,
  vertexTypes,
  searchByAttributes,
  exactMatch,
  isOpen,
}: SearchQueryRequest) {
  const explorer = useRecoilValue(explorerSelector);
  const updatePrefixes = usePrefixesUpdater();
  const { enqueueNotification } = useNotification();

  const request: KeywordSearchRequest | null = isOpen
    ? {
        searchTerm: debouncedSearchTerm,
        vertexTypes,
        searchById: true,
        limit: 10,
        // Only set these when there is a search term to reduce queries
        searchByAttributes: debouncedSearchTerm
          ? searchByAttributes
          : undefined,
        exactMatch: debouncedSearchTerm ? exactMatch : undefined,
      }
    : null;
  const query = useQuery(searchQuery(request, explorer));

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

  return query;
}

export function useCancelKeywordSearch() {
  const queryClient = useQueryClient();

  const cancelAll = useCallback(async () => {
    await queryClient.cancelQueries({
      queryKey: ["keyword-search"],
      exact: false,
    });
  }, [queryClient]);

  return cancelAll;
}
