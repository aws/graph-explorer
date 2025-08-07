import {
  Button,
  ButtonProps,
  IconButton,
  PanelFooter,
  Spinner,
} from "@/components";
import { MappedQueryResults } from "@/connector";
import { useAddToGraphMutation } from "@/hooks/useAddToGraph";
import { ChevronLeftIcon, ChevronRightIcon, ListPlusIcon } from "lucide-react";
import { Edge, Vertex } from "@/core";
import { useState } from "react";
import { cn } from "@/utils";
import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";

export function SearchResultsList({
  results,
}: {
  results: MappedQueryResults;
}) {
  // Hard coding the page size for now. Only trying to improve rendering
  // performance for large results.
  const pageSize = 100;
  const [page, setPage] = useState(0);

  // Combine all result types into a single list
  const allRows = [...results.vertices, ...results.edges, ...results.scalars];

  // Only show paging controls when over the page size
  const isPagingNecessary = allRows.length > pageSize;

  // Disable the previous button on the first page
  const disablePrevButton = page === 0;
  const handlePrevious = () => setPage(page - 1);

  // Disable the next button on last page
  const disableNextButton = (page + 1) * pageSize >= allRows.length;
  const handleNext = () => setPage(page + 1);

  const currentPageRows = allRows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <div className="grow p-3">
        <ul className="flex flex-col space-y-4">
          {currentPageRows.map(entity => (
            <li key={createEntityKey(entity, 0)}>
              <EntitySearchResult entity={entity} level={0} />
            </li>
          ))}
        </ul>
      </div>

      <PanelFooter className="sticky bottom-0 flex flex-row items-center justify-between gap-2">
        <AddAllToGraphButton
          vertices={results.vertices}
          edges={results.edges}
        />
        <div className="flex min-h-10 items-center gap-2">
          <ResultCounts results={results} />
          {isPagingNecessary ? (
            <div className="flex">
              <IconButton
                icon={<ChevronLeftIcon />}
                className="rounded-r-none"
                onClick={handlePrevious}
                disabled={disablePrevButton}
              />
              <IconButton
                icon={<ChevronRightIcon />}
                className="rounded-l-none"
                onClick={handleNext}
                disabled={disableNextButton}
              />
            </div>
          ) : null}
        </div>
      </PanelFooter>
    </>
  );
}

function ResultCounts({ results }: { results: MappedQueryResults }) {
  /** Simple algorithm to add an 's' to unit if not equal to 1. */
  function pluralizeUnitIfNeeded(count: number, singularUnit: string) {
    if (count <= 0) {
      return null;
    }
    return count === 1
      ? `${count} ${singularUnit}`
      : `${count} ${singularUnit}s`;
  }

  // Create a string of counts for the number of results of each type
  const counts = [
    pluralizeUnitIfNeeded(results.vertices.length, "node"),
    pluralizeUnitIfNeeded(results.edges.length, "edge"),
    pluralizeUnitIfNeeded(results.scalars.length, "scalar"),
  ]
    .filter(c => c != null)
    .join(" • ");

  return (
    <p className="text-text-secondary text-pretty text-sm">
      {counts || "No results"}
    </p>
  );
}

function AddAllToGraphButton({
  vertices,
  edges,
  ...props
}: ButtonProps & { vertices: Vertex[]; edges: Edge[] }) {
  const mutation = useAddToGraphMutation();

  // Ensure there are entities that can be added to the graph
  const canSendToGraph = vertices.length + edges.length > 0;
  if (!canSendToGraph) {
    return null;
  }

  return (
    <Button
      variant="filled"
      onClick={() => mutation.mutate({ vertices, edges })}
      disabled={mutation.isPending}
      className="stack shrink-0 items-center justify-center"
      {...props}
    >
      <span
        className={cn(
          "visible inline-flex items-center gap-2",
          mutation.isPending && "invisible"
        )}
      >
        <ListPlusIcon />
        Add All
      </span>
      <span
        className={cn("invisible", mutation.isPending && "visible mx-auto")}
      >
        <Spinner />
      </span>
    </Button>
  );
}
