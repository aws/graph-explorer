import { cn } from "@/utils";
import { Link } from "react-router";
import {
  ChevronRightIcon,
  ListRow,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  PanelEmptyState,
  SearchBar,
  useSearchItems,
  VertexIcon,
} from "@/components";
import { DisplayVertexTypeConfig, useDisplayVertexTypeConfigs } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import { Virtuoso } from "react-virtuoso";
import React from "react";

const ConnectionData = () => {
  return (
    <div className={cn("flex grow flex-col")}>
      <SearchableVertexTypesList />
    </div>
  );
};

function SearchableVertexTypesList() {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();

  const { filteredItems, search, setSearch } = useSearchItems(
    vtConfigs,
    config => config.displayLabel
  );

  const t = useTranslations();

  if (!vtConfigs.length) {
    return (
      <PanelEmptyState
        title={t("connection-detail.no-elements-title")}
        subtitle={t("connection-detail.no-elements-subtitle")}
      />
    );
  }

  return (
    <>
      <div className="w-full px-3 pb-1.5 pt-3">
        <SearchBar
          search={search}
          searchPlaceholder={t("connection-detail.search-placeholder")}
          onSearch={setSearch}
        />
      </div>
      <VertexTypeList vtConfigs={filteredItems} />
    </>
  );
}

function VertexTypeList({
  vtConfigs,
}: {
  vtConfigs: DisplayVertexTypeConfig[];
}) {
  const t = useTranslations();

  return (
    <Virtuoso
      className="h-full grow"
      data={vtConfigs}
      components={{
        EmptyPlaceholder: props => (
          <PanelEmptyState
            title={t("connection-detail.no-search-title")}
            subtitle={t("connection-detail.no-search-subtitle")}
            {...props}
          />
        ),
      }}
      itemContent={(index, config) => (
        <div
          className={cn(
            "px-3",
            index === 0 && "pt-3",
            index === vtConfigs.length - 1 && "pb-3"
          )}
        >
          <div
            className={cn(
              "border-x border-b",
              index === 0 && "rounded-t-lg border-t",
              index === vtConfigs.length - 1 && "rounded-b-lg"
            )}
          >
            <Row config={config} />
          </div>
        </div>
      )}
    />
  );
}

const Row = React.memo(({ config }: { config: DisplayVertexTypeConfig }) => (
  <Link to={`/data-explorer/${encodeURIComponent(config.type)}`}>
    <div className="flex min-h-12 items-center gap-4 px-4 py-2 hover:cursor-pointer">
      <VertexIcon vertexStyle={config.style} />
      <ListRowContent>
        <ListRowTitle>{config.displayLabel}</ListRowTitle>
        <ListRowSubtitle>{config.attributes.length} attributes</ListRowSubtitle>
      </ListRowContent>
      <ChevronRightIcon className="text-text-secondary size-5" />
    </div>
  </Link>
));

export default ConnectionData;
