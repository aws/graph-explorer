import type { UseQueryResult } from "@tanstack/react-query";

import type { KeywordSearchResponse } from "@/connector";

import {
  Checkbox,
  FormItem,
  Input,
  Label,
  PanelEmptyState,
  PanelError,
  SearchSadIcon,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
    <div className="bg-background-default flex h-full flex-col gap-3">
      <div className="flex flex-col gap-4 p-3">
        <div className="grid w-full grid-cols-2 gap-4">
          <FormItem>
            <Label htmlFor="nodeType">{t("node-type")}</Label>
            <Select
              name="nodeType"
              value={selectedVertexType}
              onValueChange={onVertexOptionChange}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("keyword-search.node-type-placeholder")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {vertexOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
          <FormItem>
            <Label htmlFor="attribute">{t("property")}</Label>
            <Select
              name="attribute"
              value={selectedAttribute}
              onValueChange={onAttributeOptionChange}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("keyword-search.node-attribute-placeholder")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {attributesOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        </div>

        <FormItem>
          <Label htmlFor="searchTerm">Search term</Label>
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
