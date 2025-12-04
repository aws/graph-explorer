import type { ComponentPropsWithoutRef } from "react";
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
import { type PrefixTypeConfig, usePrefixes } from "@/core";
import { Virtuoso } from "react-virtuoso";

const GeneratedPrefixes = () => {
  const items = useGeneratedPrefixes();

  const { filteredItems, search, setSearch } = useSearchItems(
    items,
    prefix => prefix.title,
  );

  if (items.length === 0) {
    return (
      <Layout>
        <NoGeneratedPrefixes />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full shrink-0 px-3 py-2">
        <SearchBar
          search={search}
          searchPlaceholder="Search for Namespaces or URIs"
          onSearch={setSearch}
        />
      </div>
      <Virtuoso
        data={filteredItems}
        components={{
          EmptyPlaceholder: NoSearchResults,
        }}
        itemContent={(_index, prefix) => <Row prefix={prefix} />}
      />
    </Layout>
  );
};

function Layout(props: ComponentPropsWithoutRef<"div">) {
  return <div className="flex h-full grow flex-col" {...props} />;
}

function useGeneratedPrefixes() {
  const prefixes = usePrefixes();

  return prefixes
    .filter(
      prefixConfig =>
        prefixConfig.__inferred === true &&
        prefixConfig.__matches &&
        prefixConfig.__matches.size > 0,
    )
    .map(mapToPrefixData)
    .toSorted((a, b) => a.title.localeCompare(b.title));
}

function NoGeneratedPrefixes() {
  return (
    <PanelEmptyState
      className="p-6"
      title="No Namespaces"
      subtitle="No auto-generated namespaces stored"
      icon={<NamespaceIcon />}
    />
  );
}

function NoSearchResults() {
  return (
    <PanelEmptyState
      className="p-6"
      title="No Namespaces Found"
      subtitle="No auto-generated namespaces found matching your search"
      icon={<NamespaceIcon />}
    />
  );
}

function mapToPrefixData(prefixConfig: PrefixTypeConfig) {
  return {
    id: prefixConfig.prefix,
    title: `${prefixConfig.prefix} ${prefixConfig.uri}`,
    titleComponent: prefixConfig.prefix,
    subtitle: prefixConfig.uri,
  };
}

type PrefixData = ReturnType<typeof mapToPrefixData>;

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

export default GeneratedPrefixes;
