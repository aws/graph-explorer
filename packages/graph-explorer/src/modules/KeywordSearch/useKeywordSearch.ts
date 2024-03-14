import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfiguration } from "../../core";
import useDebounceValue from "../../hooks/useDebounceValue";
import useTextTransform from "../../hooks/useTextTransform";
import { useKeywordSearchQuery } from "./useKeywordSearchQuery";

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel?: () => void;
}

const allVerticesValue = "__all";
const allAttributesValue = "__all";
const idAttributeValue = "__id";

const useKeywordSearch = ({ isOpen }: { isOpen: boolean }) => {
  const config = useConfiguration();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);
  const [selectedVertexType, setSelectedVertexType] =
    useState(allVerticesValue);
  const [selectedAttribute, setSelectedAttribute] =
    useState(allAttributesValue);
  const [exactMatch, setExactMatch] = useState(true);
  const [neighborsLimit, setNeighborsLimit] = useState(true);
  const textTransform = useTextTransform();
  const exactMatchOptions = [
    { label: "Exact", value: "Exact" },
    { label: "Partial", value: "Partial" },
  ];
  // Sparql uses rdfs:label, not ID
  const allowsIdSearch = config?.connection?.queryEngine !== "sparql";

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

    return [{ label: "All", value: allVerticesValue }, ...vertexOps];
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

  const onExactMatchChange = useCallback((value: string | string[]) => {
    setExactMatch(
      Array.isArray(value) ? value[0] === "Exact" : value === "Exact"
    );
  }, []);

  const onNeighborsLimitChange = useCallback(() => {
    setNeighborsLimit(neighborsLimit => !neighborsLimit);
  }, []);

  const searchableAttributes = useMemo(() => {
    if (selectedVertexType !== allVerticesValue) {
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

    if (selectedVertexType === allVerticesValue) {
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

    return `Search for ${
      vertexOptions.find(vt => vt.value === selectedVertexType)?.label
    } by ${attributes || searchById}`;
  }, [
    config,
    searchableAttributes,
    selectedVertexType,
    textTransform,
    vertexOptions,
  ]);

  const attributesOptions = useMemo(() => {
    const defaultAttributes = allowsIdSearch
      ? [
          { label: "All", value: allAttributesValue },
          { label: "ID", value: idAttributeValue },
        ]
      : [{ label: "All", value: allAttributesValue }];

    if (selectedVertexType === allVerticesValue) {
      const attributes = uniqBy(
        searchableAttributes.map(attr => ({
          value: attr.name,
          label: attr.displayLabel || textTransform(attr.name),
        })),
        op => op.value
      );
      return [...defaultAttributes, ...attributes];
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
    return [...defaultAttributes, ...attributes];
  }, [
    allowsIdSearch,
    config,
    searchableAttributes,
    selectedVertexType,
    textTransform,
  ]);

  const defaultSearchAttribute = useMemo(() => {
    const fallbackValue = allAttributesValue;

    if (config?.connection?.queryEngine === "sparql") {
      const rdfsLabel = attributesOptions.find(o => o.label === "rdfs:label");
      return rdfsLabel?.value ?? fallbackValue;
    }

    if (allowsIdSearch) {
      return idAttributeValue;
    }

    return fallbackValue;
  }, [config?.connection?.queryEngine, allowsIdSearch, attributesOptions]);

  const vertexTypes =
    selectedVertexType === allVerticesValue
      ? config?.vertexTypes
      : [selectedVertexType];
  const searchByAttributes =
    selectedAttribute === allAttributesValue
      ? uniq(
          searchableAttributes.map(attr => attr.name).concat(allAttributesValue)
        )
      : [selectedAttribute];

  const { data, isFetching, cancelAll } = useKeywordSearchQuery({
    debouncedSearchTerm,
    vertexTypes,
    searchByAttributes,
    exactMatch,
    neighborsLimit,
    isOpen,
  });

  useEffect(() => {
    setSelectedAttribute(defaultSearchAttribute);
    setExactMatch(true);
    setNeighborsLimit(true);
  }, [selectedVertexType, defaultSearchAttribute]);

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
    cancelAll,
  };
};

export default useKeywordSearch;
