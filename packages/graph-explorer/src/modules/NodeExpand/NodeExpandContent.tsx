import { useEffect, useState } from "react";
import type { Vertex } from "../../@types/entities";
import { ModuleContainerFooter, PanelError } from "../../components";
import Button from "../../components/Button";
import ExpandGraphIcon from "../../components/icons/ExpandGraphIcon";
import GraphIcon from "../../components/icons/GraphIcon";
import LoadingSpinner from "../../components/LoadingSpinner";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import { useWithTheme } from "../../core";
import { useExpandNode } from "../../hooks";
import useNeighborsOptions from "../../hooks/useNeighborsOptions";
import useTranslations from "../../hooks/useTranslations";
import NeighborsList from "../common/NeighborsList/NeighborsList";
import defaultStyles from "./NodeExpandContent.styles";
import NodeExpandFilters, { NodeExpandFilter } from "./NodeExpandFilters";
import VertexHeader from "../common/VertexHeader";
import { ExpandNodeRequest } from "../../hooks/useExpandNode";
import { useUpdateNodeCountsQuery } from "../../hooks/useUpdateNodeCounts";

export type NodeExpandContentProps = {
  vertex: Vertex;
};

export default function NodeExpandContent({ vertex }: NodeExpandContentProps) {
  const styleWithTheme = useWithTheme();

  return (
    <div className={styleWithTheme(defaultStyles)}>
      <VertexHeader vertex={vertex} />
      <ExpandSidebarContent vertex={vertex} />
    </div>
  );
}

function ExpandSidebarContent({ vertex }: { vertex: Vertex }) {
  const t = useTranslations();
  const query = useUpdateNodeCountsQuery(vertex.data.id);

  if (query.isError) {
    return <PanelError error={query.error} onRetry={query.refetch} />;
  }

  if (query.isPending) {
    return (
      <PanelEmptyState icon={<LoadingSpinner />} title={"Loading Neighbors"} />
    );
  }

  if (!query.data || query.data?.totalCount <= 0) {
    return (
      <PanelEmptyState
        icon={<GraphIcon />}
        title={t("node-expand.no-connections-title")}
        subtitle={t("node-expand.no-connections-subtitle")}
      />
    );
  }

  return (
    <>
      <NeighborsList vertex={vertex} />
      <ExpansionOptions vertex={vertex} />
    </>
  );
}

function ExpansionOptions({ vertex }: { vertex: Vertex }) {
  const t = useTranslations();
  const neighborsOptions = useNeighborsOptions(vertex);

  const [selectedType, setSelectedType] = useState<string>(
    neighborsOptions[0]?.value
  );
  const [filters, setFilters] = useState<Array<NodeExpandFilter>>([]);
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    setSelectedType(neighborsOptions[0]?.value);
  }, [neighborsOptions]);

  const hasUnfetchedNeighbors = Boolean(vertex.data.__unfetchedNeighborCount);
  const hasSelectedType = Boolean(selectedType);

  if (!hasUnfetchedNeighbors) {
    return (
      <PanelEmptyState
        className={"empty-panel-state"}
        icon={<GraphIcon />}
        title={t("node-expand.no-unfetched-title")}
        subtitle={t("node-expand.no-unfetched-subtitle")}
      />
    );
  }

  return (
    <>
      <NodeExpandFilters
        neighborsOptions={neighborsOptions}
        selectedType={selectedType}
        onSelectedTypeChange={setSelectedType}
        filters={filters}
        onFiltersChange={setFilters}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ModuleContainerFooter>
        <ExpandButton
          isDisabled={!hasUnfetchedNeighbors || !hasSelectedType}
          vertex={vertex}
          filters={{
            filterByVertexTypes: [selectedType],
            filterCriteria: filters.map(filter => ({
              name: filter.name,
              operator: "LIKE",
              value: filter.value,
            })),
            limit: limit || undefined,
            offset:
              limit !== null && vertex.data.__unfetchedNeighborCounts
                ? vertex.data.neighborsCountByType[selectedType] -
                  vertex.data.__unfetchedNeighborCounts[selectedType]
                : undefined,
          }}
        />
      </ModuleContainerFooter>
    </>
  );
}

function ExpandButton({
  isDisabled,
  vertex,
  filters,
}: ExpandNodeRequest & { isDisabled: boolean }) {
  const { expandNode, isPending } = useExpandNode();

  return (
    <Button
      icon={
        isPending ? (
          <LoadingSpinner style={{ width: 24, height: 24 }} />
        ) : (
          <ExpandGraphIcon />
        )
      }
      variant={"filled"}
      isDisabled={isPending || isDisabled}
      onPress={() => expandNode(vertex, filters)}
    >
      Expand
    </Button>
  );
}
