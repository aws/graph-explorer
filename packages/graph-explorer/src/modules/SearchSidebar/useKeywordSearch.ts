import { useAtom } from "jotai";
import { atomWithReset } from "jotai/utils";

import type { SelectOption } from "@/components";

import { useDisplayVertexTypeConfigs, useSearchableAttributes } from "@/core";
import { useQueryEngine } from "@/core/connector";
import { useTranslations } from "@/hooks";
import useDebounceValue from "@/hooks/useDebounceValue";
import { SEARCH_TOKENS } from "@/utils";

import { useKeywordSearchQuery } from "../SearchSidebar/useKeywordSearchQuery";

export interface PromiseWithCancel<T> extends Promise<T> {
  cancel?: () => void;
}

export const searchTermAtom = atomWithReset("");
export const selectedVertexTypeAtom = atomWithReset<string>(
  SEARCH_TOKENS.ALL_VERTEX_TYPES,
);
export const selectedAttributeAtom = atomWithReset<string>(
  SEARCH_TOKENS.NODE_ID,
);
export const partialMatchAtom = atomWithReset(false);

/** Gets all the searchable attributes for the selected vertex type */
function useAttributeOptions(selectedVertexType: string) {
  const allSearchableAttributes = useSearchableAttributes(selectedVertexType);
  const queryEngine = useQueryEngine();
  const t = useTranslations();

  const options: SelectOption[] = [
    {
      label: `All string ${t("properties").toLocaleLowerCase()}`,
      value: SEARCH_TOKENS.ALL_ATTRIBUTES,
    },
  ];

  // SPARQL support for ID search is not yet implemented
  if (queryEngine !== "sparql") {
    options.push({ label: "ID", value: SEARCH_TOKENS.NODE_ID });
  }

  for (const attribute of allSearchableAttributes) {
    options.push({
      label: attribute.displayLabel,
      value: attribute.name,
    });
  }
  return options;
}

/** Manages all the state and gathers all required information to render the
 * keyword search sidebar. */
export default function useKeywordSearch() {
  const queryEngine = useQueryEngine();

  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const debouncedSearchTerm = useDebounceValue(searchTerm, 600);
  const [selectedVertexType, setSelectedVertexType] = useAtom(
    selectedVertexTypeAtom,
  );
  const [selectedAttribute, setSelectedAttribute] = useAtom(
    selectedAttributeAtom,
  );
  const [partialMatch, setPartialMatch] = useAtom(partialMatchAtom);

  const exactMatchOptions = [
    { label: "Exact", value: "Exact" },
    { label: "Partial", value: "Partial" },
  ];

  const vtConfigs = useDisplayVertexTypeConfigs();
  const vertexOptions = [
    { label: "All", value: SEARCH_TOKENS.ALL_VERTEX_TYPES },
    ...vtConfigs
      .values()
      // Filtering out empty types because the queries need to be updated to support them
      .filter(vtConfig => vtConfig.type !== "")
      .map(vtConfig => ({
        label: vtConfig.displayLabel,
        value: vtConfig.type,
      })),
  ];

  const attributesOptions = useAttributeOptions(selectedVertexType);
  const defaultSearchAttribute =
    queryEngine === "sparql"
      ? (attributesOptions.find(o => o.label === "rdfs:label")?.value ??
        SEARCH_TOKENS.ALL_ATTRIBUTES)
      : SEARCH_TOKENS.NODE_ID;

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
    safeSelectedAttribute === SEARCH_TOKENS.ALL_ATTRIBUTES
      ? attributesOptions
          .filter(attr => attr.value !== SEARCH_TOKENS.ALL_ATTRIBUTES)
          .map(attr => attr.label)
          .join(", ")
      : (attributesOptions.find(opt => opt.value === safeSelectedAttribute)
          ?.label ?? safeSelectedAttribute);
  const searchPlaceholder = `Search by ${attributes}`;

  const vertexTypes =
    selectedVertexType === SEARCH_TOKENS.ALL_VERTEX_TYPES
      ? []
      : [selectedVertexType];
  const searchByAttributes =
    safeSelectedAttribute === SEARCH_TOKENS.ALL_ATTRIBUTES
      ? attributesOptions
          .filter(attr => attr.value !== SEARCH_TOKENS.ALL_ATTRIBUTES)
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
