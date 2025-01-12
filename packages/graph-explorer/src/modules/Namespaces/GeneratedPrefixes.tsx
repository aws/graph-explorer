import { useMemo } from "react";
import {
  ListRow,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  NamespaceIcon,
  SearchBar,
  useSearchItems,
} from "@/components";
import { PrefixTypeConfig, useConfiguration } from "@/core";
import { Virtuoso } from "react-virtuoso";
import React from "react";

const GeneratedPrefixes = () => {
  const config = useConfiguration();

  const items = useMemo(() => {
    return (config?.schema?.prefixes || [])
      .filter(
        prefixConfig =>
          prefixConfig.__inferred === true &&
          prefixConfig.__matches &&
          prefixConfig.__matches.size > 1
      )
      .map(mapToPrefixData)
      .toSorted((a, b) => a.title.localeCompare(b.title));
  }, [config?.schema?.prefixes]);

  const { filteredItems, search, setSearch } = useSearchItems(
    items,
    prefix => prefix.title
  );

  return (
    <>
      <div className="w-full px-3 py-2">
        <SearchBar
          search={search}
          searchPlaceholder="Search for Namespaces or URIs"
          onSearch={setSearch}
        />
      </div>
      <Virtuoso
        className="h-full grow"
        data={filteredItems}
        itemContent={(_index, prefix) => <Row prefix={prefix} />}
      />
    </>
  );
};

function mapToPrefixData(prefixConfig: PrefixTypeConfig) {
  return {
    id: prefixConfig.prefix,
    title: `${prefixConfig.prefix} ${prefixConfig.uri}`,
    titleComponent: prefixConfig.prefix,
    subtitle: prefixConfig.uri,
  };
}

type PrefixData = ReturnType<typeof mapToPrefixData>;

const Row = React.memo(({ prefix }: { prefix: PrefixData }) => {
  return (
    <div className="px-3 py-1.5">
      <ListRow className="min-h-12">
        <NamespaceIcon className="text-primary-main size-5 shrink-0" />
        <ListRowContent>
          <ListRowTitle>{prefix.titleComponent}</ListRowTitle>
          <ListRowSubtitle className="break-all">
            {prefix.subtitle}
          </ListRowSubtitle>
        </ListRowContent>
      </ListRow>
    </div>
  );
});

export default GeneratedPrefixes;
