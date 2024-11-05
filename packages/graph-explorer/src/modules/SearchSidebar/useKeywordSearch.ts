import { useCallback, useMemo } from "react";
import { AttributeConfig, useConfiguration } from "@/core";
import useDebounceValue from "@/hooks/useDebounceValue";
import useTextTransform, {
  textTransformSelector,
} from "@/hooks/useTextTransform";
import { useKeywordSearchQuery } from "../SearchSidebar/useKeywordSearchQuery";
import {
  assembledConfigSelector,
  useVertexTypeConfigs,
} from "@/core/ConfigurationProvider/useConfiguration";
import { atom, selector, useRecoilState, useRecoilValue } from "recoil";

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel?: () => void;
}

const allVerticesValue = "__all";
const allAttributesValue = "__all";
const idAttributeValue = "__id";

export const searchTermAtom = atom({ key: "searchTerm", default: "" });
export const selectedVertexTypeAtom = atom({
  key: "selectedVertexType",
  default: allVerticesValue,
});
export const selectedAttributeAtom = atom({
  key: "selectedAttribute",
  default: idAttributeValue,
});
export const partialMatchAtom = atom({ key: "partialMatch", default: false });

const searchableAttributesSelector = selector({
  key: "searchableAttributes",
  get: ({ get }) => {
    const config = get(assembledConfigSelector);
    if (!config) {
      return new Map<string, AttributeConfig[]>();
    }
    return new Map(
      config.vertexTypes.map(vertexType => [
        vertexType,
        config.getVertexTypeSearchableAttributes(vertexType),
      ])
    );
  },
});

/**
 * Searchable attributes for selected vertex type. If "All" is chosen, then
 * this is unique searchable attributes across all vertex types.
 */
function getSearchableAttributesForSelectedVertexType(
  selectedVertexType: string,
  allSearchableAttributes: Map<string, AttributeConfig[]>
) {
  return selectedVertexType === allVerticesValue
    ? new Map(
        allSearchableAttributes
          .values()
          .flatMap(a => a)
          .map(a => [a.name, a])
      )
        .values()
        .toArray()
        .sort((a, b) => a.name.localeCompare(b.name))
    : (allSearchableAttributes.get(selectedVertexType) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
}

const attributeOptionsSelector = selector({
  key: "attributeOptions",
  get: ({ get }) => {
    const config = get(assembledConfigSelector);
    if (!config) {
      return [];
    }
    const selectedVertexType = get(selectedVertexTypeAtom);
    const textTransform = get(textTransformSelector);

    // Sparql uses rdfs:label, not ID
    const allowsIdSearch = config?.connection?.queryEngine !== "sparql";

    // Get searchable attributes for selected vertex type
    const allSearchableAttributes = get(searchableAttributesSelector);
    const searchableAttributes = getSearchableAttributesForSelectedVertexType(
      selectedVertexType,
      allSearchableAttributes
    );

    const attributeOptions = (() => {
      const defaultAttributes = allowsIdSearch
        ? [
            { label: "All", value: allAttributesValue },
            { label: "ID", value: idAttributeValue },
          ]
        : [{ label: "All", value: allAttributesValue }];

      const attributes = searchableAttributes.map(attr => ({
        value: attr.name,
        label: attr.displayLabel || textTransform(attr.name),
      }));

      return [...defaultAttributes, ...attributes];
    })();

    return attributeOptions;
  },
});

/** Manages all the state and gathers all required information to render the
 * keyword search sidebar. */
export default function useKeywordSearch() {
  const config = useConfiguration();

  const [searchTerm, setSearchTerm] = useRecoilState(searchTermAtom);
  const debouncedSearchTerm = useDebounceValue(searchTerm, 600);
  const [selectedVertexType, setSelectedVertexType] = useRecoilState(
    selectedVertexTypeAtom
  );
  const [selectedAttribute, setSelectedAttribute] = useRecoilState(
    selectedAttributeAtom
  );
  const [partialMatch, setPartialMatch] = useRecoilState(partialMatchAtom);

  const textTransform = useTextTransform();
  const exactMatchOptions = [
    { label: "Exact", value: "Exact" },
    { label: "Partial", value: "Partial" },
  ];

  const vtConfigs = useVertexTypeConfigs();
  const vertexOptions = useMemo(() => {
    const vertexOps =
      vtConfigs
        .map(vtConfig => ({
          label: textTransform(vtConfig.displayLabel || vtConfig.type),
          value: vtConfig.type,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) || [];

    return [{ label: "All", value: allVerticesValue }, ...vertexOps];
  }, [textTransform, vtConfigs]);

  const attributesOptions = useRecoilValue(attributeOptionsSelector);
  const defaultSearchAttribute = useMemo(() => {
    if (config?.connection?.queryEngine === "sparql") {
      const rdfsLabel = attributesOptions.find(o => o.label === "rdfs:label");
      return rdfsLabel?.value ?? allAttributesValue;
    } else {
      return idAttributeValue;
    }
  }, [config?.connection?.queryEngine, attributesOptions]);

  /** This is the selected attribute unless the attribute is not in the
   * attribute options list (for example, the selected vertex type changed). */
  const safeSelectedAttribute =
    attributesOptions.find(opt => opt.value === selectedAttribute)?.value ??
    defaultSearchAttribute;

  const onSearchTermChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
    },
    [setSearchTerm]
  );

  const onVertexOptionChange = useCallback(
    (value: string) => {
      setSelectedVertexType(value);
    },
    [setSelectedVertexType]
  );

  const onAttributeOptionChange = useCallback(
    (value: string) => {
      setSelectedAttribute(value);
    },
    [setSelectedAttribute]
  );

  const onPartialMatchChange = useCallback(
    (value: boolean) => {
      setPartialMatch(value);
    },
    [setPartialMatch]
  );

  const searchPlaceholder = useMemo(() => {
    const attributes =
      safeSelectedAttribute === allAttributesValue
        ? attributesOptions
            .filter(attr => attr.value !== allAttributesValue)
            .map(attr => attr.label)
            .join(", ")
        : (attributesOptions.find(opt => opt.value === safeSelectedAttribute)
            ?.label ?? safeSelectedAttribute);

    return `Search by ${attributes}`;
  }, [attributesOptions, safeSelectedAttribute]);

  const vertexTypes =
    selectedVertexType === allVerticesValue ? [] : [selectedVertexType];
  const searchByAttributes =
    safeSelectedAttribute === allAttributesValue
      ? attributesOptions
          .filter(attr => attr.value !== allAttributesValue)
          .map(attr => attr.value)
      : [safeSelectedAttribute];

  const query = useKeywordSearchQuery({
    debouncedSearchTerm,
    vertexTypes,
    searchByAttributes,
    exactMatch: !partialMatch,
  });

  return {
    query,
    debouncedSearchTerm,
    onSearchTermChange,
    onVertexOptionChange,
    searchPlaceholder,
    searchTerm,
    selectedVertexType,
    vertexOptions,
    selectedAttribute: safeSelectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
    partialMatch,
    exactMatchOptions,
    onPartialMatchChange,
  };
}
