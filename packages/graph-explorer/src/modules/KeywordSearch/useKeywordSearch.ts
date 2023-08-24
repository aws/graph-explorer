import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useNotification } from "../../components/NotificationProvider";
import { KeywordSearchResponse } from "../../connector/AbstractConnector";
import { useConfiguration } from "../../core";
import useConnector from "../../core/ConnectorProvider/useConnector";
import useDebounceValue from "../../hooks/useDebounceValue";
import usePrefixesUpdater from "../../hooks/usePrefixesUpdater";
import useTextTransform from "../../hooks/useTextTransform";

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel?: () => void;
}
const useKeywordSearch = ({ isOpen }: { isOpen: boolean }) => {
  const config = useConfiguration();
  const connector = useConnector();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  const [selectedVertexType, setSelectedVertexType] = useState("__all");
  const [selectedAttribute, setSelectedAttribute] = useState("__all");
  const [exactMatch, setExactMatch] = useState(false);
  const [neighborsLimit, setNeighborsLimit] = useState(true);
  const textTransform = useTextTransform();
  const exactMatchOptions = [{ label: "Exact", value: "Exact" }, { label: "Partial", value: "Partial" }];

  const vertexOptions = useMemo(() => {
    const vertexOps =
      config?.vertexTypes
        .map(vt => {
          const vtConfig = config?.getVertexTypeConfig(vt);
          return {
            label: textTransform(vtConfig?.displayLabel || vt),
            value: vt,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)) || [];

    return [{ label: "All", value: "__all" }, ...vertexOps];
  }, [config, textTransform]);

  const onSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const onVertexOptionChange = useCallback((value: string | string[]) => {
    setSelectedVertexType(value as string);
  }, []);

  const onAttributeOptionChange = useCallback((value: string | string[]) => {
    setSelectedAttribute(value as string);
  }, []);

  const onExactMatchChange = useCallback((value: string) => {
    if (value === "Exact") {
      setExactMatch(true);
    }
    else {
      setExactMatch(false);
    }
  }, []);

  const onNeighborsLimitChange = useCallback(() => {
    setNeighborsLimit(neighborsLimit => !neighborsLimit);
  }, []);

  const searchableAttributes = useMemo(() => {
    if (selectedVertexType !== "__all") {
      return (
        config?.getVertexTypeSearchableAttributes(selectedVertexType) || []
      );
    }

    return (
      config?.schema?.vertices.flatMap(vertex =>
        config?.getVertexTypeSearchableAttributes(vertex.type)
      ) || []
    );
  }, [config, selectedVertexType]);

  const searchPlaceholder = useMemo(() => {
    const searchById =
      config?.connection?.queryEngine === "sparql" ? "URI" : "Id";

    if (selectedVertexType === "__all") {
      const attributes = uniq(
        searchableAttributes.map(
          attr => attr.displayLabel || textTransform(attr.name)
        )
      )
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 5)
        .join(", ");

      return `Search by ${attributes || searchById}...`;
    }

    const attributes = uniq(
      config
        ?.getVertexTypeSearchableAttributes(selectedVertexType)
        .map(attr => attr.displayLabel || textTransform(attr.name))
    )
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 5)
      .join(", ");

    return `Search for ${vertexOptions.find(vt => vt.value === selectedVertexType)?.label
      } by ${attributes || searchById}`;
  }, [
    config,
    searchableAttributes,
    selectedVertexType,
    textTransform,
    vertexOptions,
  ]);

  const attributesOptions = useMemo(() => {
    if (selectedVertexType === "__all") {
      const attributes = uniqBy(
        searchableAttributes.map(attr => ({
          value: attr.name,
          label: attr.displayLabel || textTransform(attr.name),
        })),
        op => op.value
      );
      return [{ label: "All", value: "__all" }, ...attributes];
    }

    const attributes = uniqBy(
      config
        ?.getVertexTypeSearchableAttributes(selectedVertexType)
        .map(attr => ({
          value: attr.name,
          label: attr.displayLabel || textTransform(attr.name),
        })),
      op => op.value
    );
    return [{ label: "All", value: "__all" }, ...attributes];
  }, [config, searchableAttributes, selectedVertexType, textTransform]);

  const { enqueueNotification } = useNotification();
  const [isMount, setMount] = useState(false);

  const vertexTypes =
    selectedVertexType === "__all" ? config?.vertexTypes : [selectedVertexType];
  const searchByAttributes =
    selectedAttribute === "__all"
      ? uniq(searchableAttributes.map(attr => attr.name).concat("__all"))
      : [selectedAttribute];

  const updatePrefixes = usePrefixesUpdater();
  const { data, isFetching } = useQuery(
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
      if (!isOpen || !config) {
        return;
      }

      const controller = new AbortController();
      const promise = connector.explorer?.keywordSearch(
        {
          searchTerm: debouncedSearchTerm,
          vertexTypes,
          searchByAttributes,
          searchById: true,
          exactMatch: exactMatch,
        },
        { abortSignal: controller.signal }
      ) as PromiseWithCancel<KeywordSearchResponse>;

      promise.cancel = () => {
        controller.abort();
      };

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

  if (isOpen && !isMount) {
    setMount(true);
  }

  useEffect(() => {
    setSelectedAttribute("__all");
    setExactMatch(false);
    setNeighborsLimit(true);
  }, [selectedVertexType]);

  return {
    isFetching,
    debouncedSearchTerm,
    onSearchTermChange,
    onVertexOptionChange,
    searchPlaceholder,
    searchTerm,
    selectedVertexType,
    vertexOptions,
    selectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
    exactMatch,
    exactMatchOptions,
    onExactMatchChange,
    neighborsLimit,
    onNeighborsLimitChange,
    searchResults: data?.vertices || [],
  };
};

export default useKeywordSearch;
