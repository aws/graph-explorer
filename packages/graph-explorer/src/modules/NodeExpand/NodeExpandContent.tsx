import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import type { Vertex } from "../../@types/entities";
import { ModuleContainerFooter, PanelError } from "../../components";
import Button from "../../components/Button";
import ExpandGraphIcon from "../../components/icons/ExpandGraphIcon";
import GraphIcon from "../../components/icons/GraphIcon";
import LoadingSpinner from "../../components/LoadingSpinner";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { useExpandNode } from "../../hooks";
import useNeighborsOptions, {
  NeighborsOptions,
} from "../../hooks/useNeighborsOptions";
import useTranslations from "../../hooks/useTranslations";
import NeighborsList from "../common/NeighborsList/NeighborsList";
import defaultStyles from "./NodeExpandContent.styles";
import NodeExpandFilters, { NodeExpandFilter } from "./NodeExpandFilters";
import { NeighborsRequest } from "../../connector/useGEFetchTypes";
import VertexHeader from "../common/VertexHeader";

export type NodeExpandContentProps = {
  classNamePrefix?: string;
  vertex: Vertex;
};

const NodeExpandContent = ({
  classNamePrefix = "ft",
  vertex,
}: NodeExpandContentProps) => {
  const styleWithTheme = useWithTheme();

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <VertexHeader vertex={vertex} classNamePrefix={classNamePrefix} />
      <ExpandSidebarContent classNamePrefix={classNamePrefix} vertex={vertex} />
    </div>
  );
};

function ExpandSidebarContent({
  classNamePrefix,
  vertex,
}: PropsWithChildren<{
  classNamePrefix?: string;
  vertex: Vertex;
}>) {
  const t = useTranslations();
  const pfx = withClassNamePrefix(classNamePrefix);
  const query = useNeighborsOptions(vertex);

  if (query.isError) {
    return <PanelError error={query.error} onRetry={query.refetch} />;
  }

  if (!query.data) {
    return (
      <PanelEmptyState icon={<LoadingSpinner />} title={"Loading Neighbors"} />
    );
  }

  if (query.data.totalCount === 0) {
    return (
      <PanelEmptyState
        icon={<GraphIcon />}
        title={t("node-expand.no-connections-title")}
        subtitle={t("node-expand.no-connections-subtitle")}
      />
    );
  }

  if (query.data.collapsedCount === 0) {
    return (
      <>
        <NeighborsList vertex={vertex} classNamePrefix={classNamePrefix} />

        <PanelEmptyState
          className={pfx("empty-panel-state")}
          icon={<GraphIcon />}
          title={t("node-expand.no-unfetched-title")}
          subtitle={t("node-expand.no-unfetched-subtitle")}
        />
      </>
    );
  }

  return (
    <>
      <NeighborsList vertex={vertex} classNamePrefix={classNamePrefix} />
      <NeighborDetails
        classNamePrefix={classNamePrefix}
        vertex={vertex}
        neighborsOptions={query.data}
      />
    </>
  );
}

function NeighborDetails({
  vertex,
  neighborsOptions: neighborsOptions,
  classNamePrefix,
}: {
  vertex: Vertex;
  neighborsOptions: NeighborsOptions;
  classNamePrefix?: string;
}) {
  const [selectedType, setSelectedType] = useState<string>(
    neighborsOptions.options[0]?.value
  );
  const [filters, setFilters] = useState<Array<NodeExpandFilter>>([]);
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    setSelectedType(neighborsOptions.options[0]?.value);
  }, [neighborsOptions]);

  const selectedNeighborsOptions = neighborsOptions.options.find(
    option => option.value === selectedType
  );

  return (
    <>
      <NodeExpandFilters
        classNamePrefix={classNamePrefix}
        neighborsOptions={neighborsOptions.options}
        selectedType={selectedType}
        onSelectedTypeChange={setSelectedType}
        filters={filters}
        onFiltersChange={setFilters}
        limit={limit}
        onLimitChange={setLimit}
      />

      <ModuleContainerFooter>
        <ExpandButton
          isDisabled={
            !selectedNeighborsOptions ||
            selectedNeighborsOptions.collapsedCount <= 0
          }
          vertexId={vertex.data.id}
          idType={vertex.data.idType}
          vertexType={(vertex.data.types ?? [vertex.data.type])?.join("::")}
          filterByVertexTypes={[selectedType]}
          filterCriteria={filters.map(filter => ({
            name: filter.name,
            operator: "LIKE",
            value: filter.value,
          }))}
          // TODO - review limit and offset when data is not sorted
          limit={limit ?? selectedNeighborsOptions?.collapsedCount}
          offset={limit === null ? 0 : selectedNeighborsOptions?.addedCount}
        />
      </ModuleContainerFooter>
    </>
  );
}

function ExpandButton({
  isDisabled,
  ...request
}: NeighborsRequest & { isDisabled: boolean }) {
  const expandNode = useExpandNode();

  const [isExpanding, setIsExpanding] = useState(false);

  const onExpandClick = useCallback(async () => {
    setIsExpanding(true);
    await expandNode(request);
    setIsExpanding(false);
  }, [request, expandNode]);
  return (
    <Button
      icon={
        isExpanding ? (
          <LoadingSpinner style={{ width: 24, height: 24 }} />
        ) : (
          <ExpandGraphIcon />
        )
      }
      variant={"filled"}
      isDisabled={isExpanding || isDisabled}
      onPress={onExpandClick}
    >
      Expand
    </Button>
  );
}

export default NodeExpandContent;
