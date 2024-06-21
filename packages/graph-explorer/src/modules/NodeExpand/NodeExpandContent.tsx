import { useEffect, useState } from "react";
import type { Vertex } from "../../@types/entities";
import { ModuleContainerFooter } from "../../components";
import Button from "../../components/Button";
import ExpandGraphIcon from "../../components/icons/ExpandGraphIcon";
import GraphIcon from "../../components/icons/GraphIcon";
import LoadingSpinner from "../../components/LoadingSpinner";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { useExpandNode } from "../../hooks";
import useNeighborsOptions from "../../hooks/useNeighborsOptions";
import useTranslations from "../../hooks/useTranslations";
import NeighborsList from "../common/NeighborsList/NeighborsList";
import defaultStyles from "./NodeExpandContent.styles";
import NodeExpandFilters, { NodeExpandFilter } from "./NodeExpandFilters";
import VertexHeader from "../common/VertexHeader";
import { ExpandNodeRequest } from "../../hooks/useExpandNode";

export type NodeExpandContentProps = {
  classNamePrefix?: string;
  vertex: Vertex;
};

const NodeExpandContent = ({
  classNamePrefix = "ft",
  vertex,
}: NodeExpandContentProps) => {
  const t = useTranslations();
  const styleWithTheme = useWithTheme();

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <VertexHeader vertex={vertex} classNamePrefix={classNamePrefix} />
      {vertex.data.neighborsCount === 0 && (
        <PanelEmptyState
          icon={<GraphIcon />}
          title={t("node-expand.no-connections-title")}
          subtitle={t("node-expand.no-connections-subtitle")}
        />
      )}
      {vertex.data.neighborsCount !== 0 && (
        <NeighborDetails vertex={vertex} classNamePrefix={classNamePrefix} />
      )}
    </div>
  );
};

function NeighborDetails({
  vertex,
  classNamePrefix,
}: {
  vertex: Vertex;
  classNamePrefix?: string;
}) {
  const t = useTranslations();
  const pfx = withClassNamePrefix(classNamePrefix);
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

  return (
    <>
      <NeighborsList vertex={vertex} classNamePrefix={classNamePrefix} />
      {!hasUnfetchedNeighbors && (
        <PanelEmptyState
          className={pfx("empty-panel-state")}
          icon={<GraphIcon />}
          title={t("node-expand.no-unfetched-title")}
          subtitle={t("node-expand.no-unfetched-subtitle")}
        />
      )}
      {hasUnfetchedNeighbors && (
        <NodeExpandFilters
          classNamePrefix={classNamePrefix}
          neighborsOptions={neighborsOptions}
          selectedType={selectedType}
          onSelectedTypeChange={setSelectedType}
          filters={filters}
          onFiltersChange={setFilters}
          limit={limit}
          onLimitChange={setLimit}
        />
      )}
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

export default NodeExpandContent;
