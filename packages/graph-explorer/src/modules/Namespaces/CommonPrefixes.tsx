import {
  ListRow,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  NamespaceIcon,
  SearchBar,
  useSearchItems,
} from "@/components";
import commonPrefixes from "@/utils/common-prefixes.json";
import React from "react";
import { Virtuoso } from "react-virtuoso";

const COMMON_PREFIXES_ITEMS = Object.entries(commonPrefixes)
  .map(([prefix, uri]) => {
    return {
      id: prefix,
      title: `${prefix}-${uri}`,
      titleComponent: prefix,
      subtitle: uri,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

type PrefixData = (typeof COMMON_PREFIXES_ITEMS)[number];

const CommonPrefixes = () => {
  const { filteredItems, search, setSearch } = useSearchItems(
    COMMON_PREFIXES_ITEMS,
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

const Row = React.memo(({ prefix }: { prefix: PrefixData }) => (
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
));

export default CommonPrefixes;
