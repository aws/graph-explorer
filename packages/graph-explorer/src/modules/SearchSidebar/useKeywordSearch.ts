import {
  displayVertexTypeConfigSelector,
  displayVertexTypeConfigsSelector,
  useDisplayVertexTypeConfigs,
} from "@/core";
import useDebounceValue from "@/hooks/useDebounceValue";
import { useKeywordSearchQuery } from "../SearchSidebar/useKeywordSearchQuery";

import { queryEngineSelector, useQueryEngine } from "@/core/connector";
import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithReset } from "jotai/utils";

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel?: () => void;
}

const allVerticesValue = "__all";
const allAttributesValue = "__all";
const idAttributeValue = "__id";

export const searchTermAtom = atomWithReset("");
export const selectedVertexTypeAtom = atomWithReset(allVerticesValue);
export const selectedAttributeAtom = atomWithReset(idAttributeValue);
export const partialMatchAtom = atomWithReset(false);

/** Gets all searchable attributes across all vertex types */
const combinedSearchableAttributesSelector = atom(get => {
  const allVertexTypeConfigs = get(displayVertexTypeConfigsSelector);

  // Get unique searchable attributes across all vertex types
  const uniqueSearchableAttributes = new Map(
    allVertexTypeConfigs
      .values()
      .flatMap(c => c.attributes)
      .filter(a => a.isSearchable)
      .map(a => [a.name, a])
  )
    .values()
    .toArray();

  // Sort by name
  return uniqueSearchableAttributes.sort((a, b) =>
    a.name.localeCompare(b.name)
  );
});

const attributeOptionsSelector = atom(get => {
  const selectedVertexType = get(selectedVertexTypeAtom);

  // Sparql uses rdfs:label, not ID
  const allowsIdSearch = get(queryEngineSelector) !== "sparql";

  // Get searchable attributes for selected vertex type
  const searchableAttributes =
    selectedVertexType === allVerticesValue
      ? get(combinedSearchableAttributesSelector)
      : get(displayVertexTypeConfigSelector(selectedVertexType)).attributes;

  const attributeOptions = (() => {
    const defaultAttributes = allowsIdSearch
      ? [
          { label: "All", value: allAttributesValue },
          { label: "ID", value: idAttributeValue },
        ]
      : [{ label: "All", value: allAttributesValue }];

    const attributes = searchableAttributes.map(attr => ({
      value: attr.name,
      label: attr.displayLabel,
    }));

    return [...defaultAttributes, ...attributes];
  })();

  return attributeOptions;
});

/** Manages all the state and gathers all required information to render the
 * keyword search sidebar. */
export default function useKeywordSearch() {
  const queryEngine = useQueryEngine();

  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const debouncedSearchTerm = useDebounceValue(searchTerm, 600);
  const [selectedVertexType, setSelectedVertexType] = useAtom(
    selectedVertexTypeAtom
  );
  const [selectedAttribute, setSelectedAttribute] = useAtom(
    selectedAttributeAtom
  );
  const [partialMatch, setPartialMatch] = useAtom(partialMatchAtom);

  const exactMatchOptions = [
    { label: "Exact", value: "Exact" },
    { label: "Partial", value: "Partial" },
  ];

  const vtConfigs = useDisplayVertexTypeConfigs();
  const vertexOptions = [
    { label: "All", value: allVerticesValue },
    ...vtConfigs
      .values()
      // Filtering out empty types because the queries need to be updated to support them
      .filter(vtConfig => vtConfig.type !== "")
      .map(vtConfig => ({
        label: vtConfig.displayLabel,
        value: vtConfig.type,
      })),
  ];

  const attributesOptions = useAtomValue(attributeOptionsSelector);
  const defaultSearchAttribute =
    queryEngine === "sparql"
      ? (attributesOptions.find(o => o.label === "rdfs:label")?.value ??
        allAttributesValue)
      : idAttributeValue;

  /** This is the selected attribute unless the attribute is not in the
   * attribute options list (for example, the selected vertex type changed). */
  const safeSelectedAttribute =
    attributesOptions.find(opt => opt.value === selectedAttribute)?.value ??
    defaultSearchAttribute;

  const onSearchTermChange = (value: string) => setSearchTerm(value);
  const onVertexOptionChange = (value: string) => setSelectedVertexType(value);
  const onAttributeOptionChange = (value: string) =>
    setSelectedAttribute(value);

  const onPartialMatchChange = (value: boolean) => setPartialMatch(value);

  const attributes =
    safeSelectedAttribute === allAttributesValue
      ? attributesOptions
          .filter(attr => attr.value !== allAttributesValue)
          .map(attr => attr.label)
          .join(", ")
      : (attributesOptions.find(opt => opt.value === safeSelectedAttribute)
          ?.label ?? safeSelectedAttribute);
  const searchPlaceholder = `Search by ${attributes}`;

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
