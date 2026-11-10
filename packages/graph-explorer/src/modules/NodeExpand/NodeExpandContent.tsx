import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useRef, useState } from "react";

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
import {
  type DisplayVertex,
  positiveWholeNumberError,
  useNeighbors,
} from "@/core";
import { useExpandNode } from "@/hooks";
import { useDefaultNeighborExpansionLimit } from "@/hooks/useExpandNode";
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
  const [limit, setLimit] = useState<number | undefined>(defaultLimit ?? 100);
  const [hasTriedInvalidExpand, setHasTriedInvalidExpand] = useState(false);
  const limitInputRef = useRef<HTMLInputElement>(null);
  const { expandNode, isPending } = useExpandNode();

  const hasSelectedType = Boolean(selectedType);
  const hasUnfetchedNeighbors = (neighbors?.unfetched ?? 0) > 0;
  const limitIssue = limitEnabled ? positiveWholeNumberError(limit) : undefined;
  const limitError = hasTriedInvalidExpand ? limitIssue : undefined;

  // Reset filters when selected type changes
  const [prevSelectedType, setPrevSelectedType] = useState(selectedType);
  if (prevSelectedType !== selectedType) {
    setPrevSelectedType(selectedType);
    setFilters([]);
  }

  function handleExpand() {
    if (limitIssue) {
      setHasTriedInvalidExpand(true);
      limitInputRef.current?.focus();
      return;
    }
    expandNode({
      vertexId,
      filterByVertexTypes: [selectedType],
      attributeFilters: filters.map(filter => ({
        name: filter.name,
        value: filter.value,
      })),
      limit: limitEnabled ? limit : undefined,
    });
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
        limitError={limitError}
        limitInputRef={limitInputRef}
        limitEnabled={limitEnabled}
        onLimitEnabledToggle={setLimitEnabled}
      />
      <PanelFooter className="sticky bottom-0 flex flex-row justify-end">
        <Button
          variant="primary"
          disabled={isPending || !hasUnfetchedNeighbors || !hasSelectedType}
          onClick={handleExpand}
        >
          <Spinner loading={isPending}>
            <ExpandGraphIcon />
          </Spinner>
          Expand
        </Button>
      </PanelFooter>
    </>
  );
}

function firstNeighborAvailableForExpansion(
  neighborsOptions: NeighborOption[],
) {
  return neighborsOptions.find(x => !x.isDisabled) ?? neighborsOptions[0];
}
