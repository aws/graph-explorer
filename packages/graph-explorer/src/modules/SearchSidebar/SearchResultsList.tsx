import {
  PanelEmptyState,
  LoadingSpinner,
  PanelError,
  SearchSadIcon,
  Button,
} from "@/components";
import { KeywordSearchResponse } from "@/connector/useGEFetchTypes";
import { UseQueryResult } from "@tanstack/react-query";
import { useCancelKeywordSearch } from "./useKeywordSearchQuery";
import { NodeSearchResult } from "./NodeSearchResult";
import { useAddToGraph } from "@/hooks/useAddToGraph";
import { MappedQueryResults } from "@/connector/gremlin/mappers/mapResults";
import { PlusCircleIcon } from "lucide-react";

export function SearchResultsList({
  query,
}: {
  query: UseQueryResult<KeywordSearchResponse | null, Error>;
}) {
  const cancelAll = useCancelKeywordSearch();

  if (query.isLoading) {
    return (
      <PanelEmptyState
        title="Searching..."
        subtitle="Looking for matching results"
        actionLabel="Cancel"
        onAction={() => cancelAll()}
        icon={<LoadingSpinner />}
        className="p-8"
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <PanelError error={query.error} onRetry={query.refetch} className="p-8" />
    );
  }

  if (
    !query.data ||
    (query.data.vertices.length === 0 &&
      query.data.edges.length === 0 &&
      query.data.scalars.length === 0)
  ) {
    return (
      <PanelEmptyState
        title="No Results"
        subtitle="Your criteria does not match with any record"
        icon={<SearchSadIcon />}
        className="p-8"
      />
    );
  }

  return <LoadedResults {...query.data} />;
}

function LoadedResults({ vertices, edges, scalars }: MappedQueryResults) {
  const sendToGraph = useAddToGraph(...vertices, ...edges);
  const canSendToGraph = vertices.length > 0 || edges.length > 0;

  const counts = [
    vertices.length ? `${vertices.length} nodes` : null,
    edges.length ? `${edges.length} edges` : null,
    scalars.length ? `${scalars.length} values` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <>
      <div className="bg-background-contrast/35 grow p-3">
        <ul className="border-divider flex flex-col overflow-hidden rounded-xl border shadow">
          {vertices.map(entity => (
            <li
              key={`node:${entity.type}:${entity.id}`}
              className="border-divider border-b last:border-0"
            >
              <NodeSearchResult node={entity} />
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-background-default border-divider sticky bottom-0 flex flex-col border-t">
        <div className="flex flex-row items-center justify-between border-b px-3 py-3">
          <Button
            icon={<PlusCircleIcon />}
            onPress={sendToGraph}
            isDisabled={!canSendToGraph}
          >
            Add all
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-text-secondary text-sm">
              {counts || "No results"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
