import {
  ListRow,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  NamespaceIcon,
  PanelEmptyState,
  SearchBar,
  useSearchItems,
} from "@/components";
import commonPrefixes from "@/utils/common-prefixes.json";
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
    <div className="flex h-full grow flex-col">
      <div className="w-full shrink-0 px-3 py-2">
        <SearchBar
          search={search}
          searchPlaceholder="Search for namespaces or URIs"
          onSearch={setSearch}
        />
      </div>
      <Virtuoso
        components={{
          EmptyPlaceholder: NoSearchResults,
        }}
        data={filteredItems}
        itemContent={(_index, prefix) => <Row prefix={prefix} />}
      />
    </div>
  );
};

function NoSearchResults() {
  return (
    <PanelEmptyState
      className="p-6"
      title="No Namespaces Found"
      subtitle="No common namespaces found matching your search"
      icon={<NamespaceIcon />}
    />
  );
}

function Row({ prefix }: { prefix: PrefixData }) {
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
}

export default CommonPrefixes;
