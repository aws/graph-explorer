import { useQuery, useQueryClient } from "@tanstack/react-query";

import { type KeywordSearchRequest, searchQuery } from "@/connector";
import { useUpdateSchemaFromEntities } from "@/core";

export type SearchQueryRequest = {
  debouncedSearchTerm: string;
  vertexTypes?: string[];
  searchByAttributes: string[];
  exactMatch: boolean;
  caseInsensitive: boolean;
};

export function useKeywordSearchQuery({
  debouncedSearchTerm,
  vertexTypes,
  searchByAttributes,
  exactMatch,
  caseInsensitive
}: SearchQueryRequest) {
  const updateSchema = useUpdateSchemaFromEntities();

  const request: KeywordSearchRequest = {
    searchTerm: debouncedSearchTerm,
    vertexTypes,
    limit: 10,
    // Only set these when there is a search term to reduce queries
    searchByAttributes: debouncedSearchTerm ? searchByAttributes : undefined,
    exactMatch: debouncedSearchTerm ? exactMatch : undefined,
    caseInsensitive: debouncedSearchTerm ? caseInsensitive : undefined,
  };
  const query = useQuery(searchQuery(request, updateSchema));

  return query;
}

export function useCancelKeywordSearch() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.cancelQueries({
      queryKey: ["keyword-search"],
      exact: false,
    });
  };
}
