import type { UseQueryResult } from "@tanstack/react-query";

import type { KeywordSearchResponse } from "@/connector";

import {
  Checkbox,
  Combobox,
  FormItem,
  Input,
  Label,
  PanelEmptyState,
  PanelError,
  SearchSadIcon,
  Spinner,
} from "@/components";
import { createPatchedResultVertex } from "@/connector/entities";
import { useTranslations } from "@/hooks";

import { SearchResultsList } from "./SearchResultsList";
import useKeywordSearch from "./useKeywordSearch";
import { useCancelKeywordSearch } from "./useKeywordSearchQuery";

export function FilterSearchTabContent() {
  const t = useTranslations();
  const {
    query,
    onSearchTermChange,
    onVertexOptionChange,
    searchPlaceholder,
    searchTerm,
    selectedVertexType,
    vertexOptions,
    selectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
    partialMatch,
    onPartialMatchChange,
  } = useKeywordSearch();

  return (
    <div className="bg-background flex h-full flex-col gap-3">
      <div className="flex flex-col gap-4 p-3">
        <div className="grid w-full grid-cols-2 gap-4">
          <FormItem>
            <Label htmlFor="nodeType">{t("node-type")}</Label>
            <Combobox
              id="nodeType"
              options={vertexOptions}
              value={selectedVertexType}
              onValueChange={onVertexOptionChange}
              placeholder={t("keyword-search.node-type-placeholder")}
            />
          </FormItem>
          <FormItem>
            <Label htmlFor="attribute">{t("property")}</Label>
            <Combobox
              id="attribute"
              options={attributesOptions}
              value={selectedAttribute}
              onValueChange={onAttributeOptionChange}
              placeholder={t("keyword-search.node-attribute-placeholder")}
            />
          </FormItem>
        </div>

        <FormItem>
          <Label htmlFor="searchTerm">Search string term</Label>
          <Input
            name="searchTerm"
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </FormItem>
        <div className="flex gap-6">
          <Label className="inline-flex items-center gap-2 hover:cursor-pointer">
            <Checkbox
              checked={partialMatch}
              onCheckedChange={checked =>
                onPartialMatchChange(Boolean(checked))
              }
            />
            Partial match
          </Label>
        </div>
      </div>

      <SearchResultsListContainer query={query} />
    </div>
  );
}

function SearchResultsListContainer({
  query,
}: {
  query: UseQueryResult<KeywordSearchResponse | null, Error>;
}) {
  const cancelAll = useCancelKeywordSearch();

  if (query.isLoading) {
    return (
      <PanelEmptyState
        title="Searching..."
        subtitle="Looking for matching results"
        actionLabel="Cancel"
        onAction={() => cancelAll()}
        icon={<Spinner />}
        className="p-8"
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <PanelError error={query.error} onRetry={query.refetch} className="p-8" />
    );
  }

  if (!query.data || query.data.vertices.length === 0) {
    return (
      <PanelEmptyState
        title="No Results"
        subtitle="Your criteria does not match with any record"
        icon={<SearchSadIcon />}
        className="p-8"
      />
    );
  }

  return (
    <SearchResultsList
      results={query.data.vertices.map(createPatchedResultVertex)}
    />
  );
}
