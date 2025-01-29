import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useExplorer } from "@/core/connector";
import usePrefixesUpdater from "@/hooks/usePrefixesUpdater";
import { useCallback, useEffect } from "react";
import { KeywordSearchRequest, searchQuery } from "@/connector";

export type SearchQueryRequest = {
  debouncedSearchTerm: string;
  vertexTypes?: string[];
  searchByAttributes: string[];
  exactMatch: boolean;
};

export function useKeywordSearchQuery({
  debouncedSearchTerm,
  vertexTypes,
  searchByAttributes,
  exactMatch,
}: SearchQueryRequest) {
  const explorer = useExplorer();
  const queryClient = useQueryClient();
  const updatePrefixes = usePrefixesUpdater();

  const request: KeywordSearchRequest = {
    searchTerm: debouncedSearchTerm,
    vertexTypes,
    limit: 10,
    // Only set these when there is a search term to reduce queries
    searchByAttributes: debouncedSearchTerm ? searchByAttributes : undefined,
    exactMatch: debouncedSearchTerm ? exactMatch : undefined,
  };
  const query = useQuery(searchQuery(request, explorer, queryClient));

  // Sync sparql prefixes
  useEffect(() => {
    if (!query.data) {
      return;
    }
    updatePrefixes(query.data.vertices.map(v => v.id));
  }, [query.data, updatePrefixes]);

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
