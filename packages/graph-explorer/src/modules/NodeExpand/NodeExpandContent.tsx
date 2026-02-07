import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";

import type { VertexId } from "@/core";

import {
  Button,
  DefaultQueryErrorBoundary,
  ExpandGraphIcon,
  GraphIcon,
  PanelEmptyState,
  PanelFooter,
  Spinner,
  VertexRow,
} from "@/components";
import { neighborsCountQuery } from "@/connector";
import { type DisplayVertex, useNeighbors } from "@/core";
import { useExpandNode } from "@/hooks";
import {
  type ExpandNodeFilters,
  useDefaultNeighborExpansionLimit,
} from "@/hooks/useExpandNode";
import useNeighborsOptions, {
  type NeighborOption,
} from "@/hooks/useNeighborsOptions";
import useTranslations from "@/hooks/useTranslations";
import NeighborsList from "@/modules/common/NeighborsList/NeighborsList";

import NodeExpandFilters, { type NodeExpandFilter } from "./NodeExpandFilters";

export type NodeExpandContentProps = {
  vertex: DisplayVertex;
};

export default function NodeExpandContent({ vertex }: NodeExpandContentProps) {
  return (
    <div className="flex h-full grow flex-col">
      <VertexRow vertex={vertex} className="border-b p-3" />
      <DefaultQueryErrorBoundary>
        <Suspense fallback={<Loading />}>
          <ExpandSidebarContent vertexId={vertex.id} />
        </Suspense>
      </DefaultQueryErrorBoundary>
    </div>
  );
}

function Loading() {
  return <PanelEmptyState icon={<Spinner />} title="Loading Neighbors" />;
}

function ExpandSidebarContent({ vertexId }: { vertexId: VertexId }) {
  const t = useTranslations();
  const { data } = useSuspenseQuery(neighborsCountQuery(vertexId));
  const neighborsOptions = useNeighborsOptions(vertexId);

  if (data.totalCount <= 0) {
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
      <NeighborsList vertexId={vertexId} />
      <ExpansionOptions
        vertexId={vertexId}
        neighborsOptions={neighborsOptions}
        key={neighborsOptions.map(o => o.value).join()}
      />
    </>
  );
}

function ExpansionOptions({
  vertexId,
  neighborsOptions,
}: {
  vertexId: VertexId;
  neighborsOptions: NeighborOption[];
}) {
  const t = useTranslations();
  const neighbors = useNeighbors(vertexId);
  const defaultLimit = useDefaultNeighborExpansionLimit();

  const [selectedType, setSelectedType] = useState<string>(
    firstNeighborAvailableForExpansion(neighborsOptions)?.value ?? "",
  );
  const [filters, setFilters] = useState<Array<NodeExpandFilter>>([]);
  const [limitEnabled, setLimitEnabled] = useState(Boolean(defaultLimit));
  const [limit, setLimit] = useState<number>(defaultLimit ?? 100);

  const hasSelectedType = Boolean(selectedType);
  const hasUnfetchedNeighbors = (neighbors?.unfetched ?? 0) > 0;

  // Reset filters when selected type changes
  const [prevSelectedType, setPrevSelectedType] = useState(selectedType);
  if (prevSelectedType !== selectedType) {
    setPrevSelectedType(selectedType);
    setFilters([]);
  }

  if (!hasUnfetchedNeighbors) {
    return (
      <PanelEmptyState
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
        limitEnabled={limitEnabled}
        onLimitEnabledToggle={setLimitEnabled}
      />
      <PanelFooter className="sticky bottom-0 flex flex-row justify-end">
        <ExpandButton
          isDisabled={!hasUnfetchedNeighbors || !hasSelectedType}
          vertexId={vertexId}
          filters={{
            filterByVertexTypes: [selectedType],
            filterCriteria: filters.map(filter => ({
              name: filter.name,
              operator: "LIKE",
              value: filter.value,
            })),
            limit: limitEnabled && limit ? limit : undefined,
          }}
        />
      </PanelFooter>
    </>
  );
}

function ExpandButton({
  vertexId,
  isDisabled,
  filters,
}: {
  vertexId: VertexId;
  isDisabled: boolean;
  filters: ExpandNodeFilters;
}) {
  const { expandNode, isPending } = useExpandNode();

  return (
    <Button
      variant="filled"
      disabled={isPending || isDisabled}
      onClick={() => expandNode({ vertexId, ...filters })}
    >
      <Spinner loading={isPending}>
        <ExpandGraphIcon />
      </Spinner>
      Expand
    </Button>
  );
}

function firstNeighborAvailableForExpansion(
  neighborsOptions: NeighborOption[],
) {
  return neighborsOptions.find(x => !x.isDisabled) ?? neighborsOptions[0];
}
