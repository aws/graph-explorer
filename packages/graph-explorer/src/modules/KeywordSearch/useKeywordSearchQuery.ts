import { useQuery } from "react-query";
import { useNotification } from "../../components/NotificationProvider";
import { useConfiguration } from "../../core";
import useConnector from "../../core/ConnectorProvider/useConnector";
import usePrefixesUpdater from "../../hooks/usePrefixesUpdater";

export type SearchQueryRequest = {
  debouncedSearchTerm: string;
  vertexTypes?: string[];
  searchByAttributes: string[];
  exactMatch: boolean;
  neighborsLimit: boolean;
  isMount: boolean;
  isOpen: boolean;
};

export function useKeywordSearchQuery({
  debouncedSearchTerm,
  vertexTypes,
  searchByAttributes,
  exactMatch,
  neighborsLimit,
  isMount,
  isOpen,
}: SearchQueryRequest) {
  const config = useConfiguration();
  const connector = useConnector();
  const updatePrefixes = usePrefixesUpdater();
  const { enqueueNotification } = useNotification();

  return useQuery(
    [
      "keyword-search",
      debouncedSearchTerm,
      vertexTypes,
      searchByAttributes,
      exactMatch,
      neighborsLimit,
      isMount,
      isOpen,
    ],
    () => {
      if (!isOpen || !config || !connector.explorer) {
        return;
      }
      const promise = connector.explorer.keywordSearch({
        searchTerm: debouncedSearchTerm,
        vertexTypes,
        searchByAttributes,
        searchById: true,
        exactMatch,
      });
      return promise;
    },
    {
      enabled: !!config,
      onSuccess: response => {
        if (!response) {
          return;
        }
        updatePrefixes(response.vertices.map(v => v.data.id));
      },
      onError: (e: Error) => {
        enqueueNotification({
          type: "error",
          title: "Something went wrong",
          message: e.message,
        });
      },
    }
  );
}
