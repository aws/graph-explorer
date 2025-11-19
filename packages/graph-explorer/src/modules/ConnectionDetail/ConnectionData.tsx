import { cn } from "@/utils";
import { Link } from "react-router";
import {
  ChevronRightIcon,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  PanelEmptyState,
  SearchBar,
  useSearchItems,
  VertexIcon,
} from "@/components";
import {
  type DisplayVertexTypeConfig,
  useDisplayVertexTypeConfigs,
  useQueryEngine,
  useVertexPreferences,
} from "@/core";
import useTranslations from "@/hooks/useTranslations";
import { Virtuoso } from "react-virtuoso";
import type { ComponentPropsWithoutRef } from "react";

export default function ConnectionData() {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();

  const { filteredItems, search, setSearch } = useSearchItems(
    vtConfigs,
    config => config.displayLabel,
  );

  const t = useTranslations();

  if (!vtConfigs.length) {
    return (
      <Layout>
        <PanelEmptyState
          title={t("connection-detail.no-elements-title")}
          subtitle={t("connection-detail.no-elements-subtitle")}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-3 pt-3 pb-1.5">
        <SearchBar
          search={search}
          searchPlaceholder={t("connection-detail.search-placeholder")}
          onSearch={setSearch}
        />
      </div>
      <VertexTypeList vtConfigs={filteredItems} />
    </Layout>
  );
}

function Layout({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex grow flex-col", className)} {...props} />;
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
            index === vtConfigs.length - 1 && "pb-3",
          )}
        >
          <div
            className={cn(
              "border-x border-b",
              index === 0 && "rounded-t-lg border-t",
              index === vtConfigs.length - 1 && "rounded-b-lg",
            )}
          >
            <Row config={config} />
          </div>
        </div>
      )}
    />
  );
}

function Row({ config }: { config: DisplayVertexTypeConfig }) {
  const vertexPreferences = useVertexPreferences(config.type);
  const queryEngine = useQueryEngine();
  const unit =
    config.attributes.length === 1
      ? queryEngine === "sparql"
        ? "predicate"
        : "property"
      : queryEngine === "sparql"
        ? "predicates"
        : "properties";

  return (
    <Link to={`/data-explorer/${encodeURIComponent(config.type)}`}>
      <div className="@container/vertex-row flex min-h-12 items-center gap-4 px-4 py-2 hover:cursor-pointer">
        <VertexIcon
          vertexStyle={vertexPreferences}
          className="@max-md:hidden"
        />
        <ListRowContent>
          <ListRowTitle className="wrap-anywhere">
            {config.displayLabel}
          </ListRowTitle>
          <ListRowSubtitle>
            {config.attributes.length} {unit}
          </ListRowSubtitle>
        </ListRowContent>
        <ChevronRightIcon className="text-text-secondary size-5" />
      </div>
    </Link>
  );
}
