import { cn } from "@/utils";
import { Link } from "react-router";
import {
  ChevronRightIcon,
  Chip,
  EdgeIcon,
  GraphIcon,
  ListRow,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  PanelEmptyState,
  SearchBar,
  useSearchItems,
  VertexIcon,
} from "@/components";
import HumanReadableNumberFormatter from "@/components/HumanReadableNumberFormatter";
import {
  DisplayVertexTypeConfig,
  useDisplayVertexTypeConfigs,
  useWithTheme,
} from "@/core";
import useEntitiesCounts from "@/hooks/useEntitiesCounts";
import useTranslations from "@/hooks/useTranslations";
import defaultStyles from "./ConnectionDetail.styles";
import { Virtuoso } from "react-virtuoso";
import React from "react";

const ConnectionData = () => {
  const styleWithTheme = useWithTheme();
  const { totalNodes, totalEdges } = useEntitiesCounts();
  const t = useTranslations();

  return (
    <div className={cn(styleWithTheme(defaultStyles), "flex grow flex-col")}>
      <div className="info-bar">
        <div className="item">
          <div className="tag">{t("connection-detail.nodes")}</div>
          <div className="value">
            <Chip className="value-chip">
              <GraphIcon />
              {totalNodes != null && (
                <HumanReadableNumberFormatter value={totalNodes} />
              )}
              {totalNodes == null && "Unknown"}
            </Chip>
          </div>
        </div>
        <div className="item">
          <div className="tag">{t("connection-detail.edges")}</div>
          <div className="value">
            <Chip className="value-chip">
              <EdgeIcon />
              {totalEdges != null && (
                <HumanReadableNumberFormatter value={totalEdges} />
              )}
              {totalEdges == null && "Unknown"}
            </Chip>
          </div>
        </div>
      </div>

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
        title={t("connection-detail.no-types-title")}
        subtitle={t("connection-detail.no-types-subtitle")}
      />
    );
  }

  return (
    <>
      <div className="w-full px-3 py-2">
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
  if (!vtConfigs.length) {
    return (
      <PanelEmptyState
        title={t("connection-detail.no-search-title")}
        subtitle={t("connection-detail.no-search-subtitle")}
      />
    );
  }

  return (
    <Virtuoso
      className="h-full grow"
      data={vtConfigs}
      itemContent={(_index, config) => <Row config={config} />}
    />
  );
}

const Row = React.memo(({ config }: { config: DisplayVertexTypeConfig }) => (
  <div className="px-3 py-1.5">
    <Link to={`/data-explorer/${encodeURIComponent(config.type)}`}>
      <ListRow className="min-h-12 hover:cursor-pointer">
        <VertexIcon vertexStyle={config.style} />
        <ListRowContent>
          <ListRowTitle>{config.displayLabel}</ListRowTitle>
          <ListRowSubtitle>
            {config.attributes.length} attributes
          </ListRowSubtitle>
        </ListRowContent>
        <ChevronRightIcon className="text-text-secondary size-5" />
      </ListRow>
    </Link>
  </div>
));

export default ConnectionData;
