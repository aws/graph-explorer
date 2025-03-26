import {
  Button,
  ButtonProps,
  PanelEmptyState,
  LoadingSpinner,
  PanelError,
  SearchSadIcon,
  PanelFooter,
  Spinner,
} from "@/components";
import { KeywordSearchResponse, MappedQueryResults } from "@/connector";
import { UseQueryResult } from "@tanstack/react-query";
import { useCancelKeywordSearch } from "./useKeywordSearchQuery";
import { NodeSearchResult } from "./NodeSearchResult";
import { useAddToGraphMutation } from "@/hooks/useAddToGraph";
import { PlusCircleIcon } from "lucide-react";
import { EdgeSearchResult } from "./EdgeSearchResult";
import { ScalarSearchResult } from "./ScalarSearchResult";
import { Edge, Vertex } from "@/core";

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
  const counts = [
    vertices.length ? `${vertices.length} nodes` : null,
    edges.length ? `${edges.length} edges` : null,
    scalars.length ? `${scalars.length} values` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <>
      <div className="bg-background-contrast/35 flex grow flex-col p-3">
        <ul className="border-divider flex flex-col overflow-hidden rounded-xl border shadow">
          {vertices.map(entity => (
            <li
              key={`node:${entity.type}:${entity.id}`}
              className="border-divider content-auto intrinsic-size-16 border-b last:border-0"
            >
              <NodeSearchResult node={entity} />
            </li>
          ))}
          {edges.map(entity => (
            <li
              key={`edge:${entity.type}:${entity.id}`}
              className="border-divider content-auto intrinsic-size-16 border-b last:border-0"
            >
              <EdgeSearchResult edge={entity} />
            </li>
          ))}
          {scalars.map((entity, index) => (
            <li
              key={`scalar:${String(entity)}:${index}`}
              className="border-divider content-auto intrinsic-size-16 border-b last:border-0"
            >
              <ScalarSearchResult scalar={entity} />
            </li>
          ))}
        </ul>
      </div>

      <PanelFooter className="sticky bottom-0 flex flex-row items-center justify-between">
        <AddAllToGraphButton vertices={vertices} edges={edges} />
        <div className="flex items-center gap-2">
          <div className="text-text-secondary text-sm">
            {counts || "No results"}
          </div>
        </div>
      </PanelFooter>
    </>
  );
}

function AddAllToGraphButton({
  vertices,
  edges,
  ...props
}: ButtonProps & { vertices: Vertex[]; edges: Edge[] }) {
  const mutation = useAddToGraphMutation();
  const canSendToGraph = vertices.length > 0 || edges.length > 0;

  return (
    <Button
      onClick={() => mutation.mutate({ vertices, edges })}
      disabled={!canSendToGraph || mutation.isPending}
      {...props}
    >
      {mutation.isPending ? <Spinner /> : <PlusCircleIcon />}
      Add all
    </Button>
  );
}
