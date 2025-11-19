import {
  Button,
  type ButtonProps,
  IconButton,
  PanelEmptyState,
  PanelFooter,
  Spinner,
} from "@/components";
import { useAddToGraphMutation } from "@/hooks/useAddToGraph";
import { ChevronLeftIcon, ChevronRightIcon, ListIcon } from "lucide-react";
import { useState } from "react";
import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";
import {
  getAllGraphableEntities,
  type PatchedResultEntity,
} from "@/connector/entities";
import { ShowRawResponseDialogButton } from "./ShowRawResponseDialog";

export function SearchResultsList({
  results,
  rawResponse,
}: {
  results: PatchedResultEntity[];
  rawResponse?: unknown;
}) {
  // Hard coding the page size for now. Only trying to improve rendering
  // performance for large results.
  const pageSize = 100;
  const [page, setPage] = useState(0);

  // Only show paging controls when over the page size
  const isPagingNecessary = results.length > pageSize;

  // Disable the previous button on the first page
  const disablePrevButton = page === 0;
  const handlePrevious = () => setPage(page - 1);

  // Disable the next button on last page
  const disableNextButton = (page + 1) * pageSize >= results.length;
  const handleNext = () => setPage(page + 1);

  const currentPageNumber = page + 1;
  const currentPageRows = results.slice(
    page * pageSize,
    currentPageNumber * pageSize,
  );
  const countOfPages = Math.ceil(results.length / pageSize);

  return (
    <>
      <div className="grow space-y-6 p-3">
        <div className="flex flex-row items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">Results</h1>
            <ResultCounts results={results} />
          </div>
          <div className="grow" />
          {rawResponse !== undefined && (
            <ShowRawResponseDialogButton rawResponse={rawResponse} />
          )}
          <AddAllToGraphButton entities={results} />
        </div>

        {currentPageRows.length === 0 ? (
          <EmptyResults />
        ) : (
          <ul className="flex flex-col space-y-4">
            {currentPageRows.map(entity => (
              <li key={createEntityKey(entity, 0)}>
                <EntitySearchResult entity={entity} level={0} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isPagingNecessary ? (
        <PanelFooter className="sticky bottom-0 flex flex-row items-center justify-between gap-2">
          <div className="flex min-h-10 grow items-center justify-end gap-2">
            <p>
              Page {currentPageNumber} of {countOfPages}
            </p>
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
          </div>
        </PanelFooter>
      ) : null}
    </>
  );
}

function ResultCounts({ results }: { results: PatchedResultEntity[] }) {
  const count = results.length;
  const label = count === 1 ? `${count} Item` : `${count} Items`;

  return <p className="text-text-secondary text-sm text-pretty">{label}</p>;
}

function AddAllToGraphButton({
  entities,
  ...props
}: ButtonProps & { entities: PatchedResultEntity[] }) {
  const mutation = useAddToGraphMutation();
  const graphableEntities = getAllGraphableEntities(entities);
  const addAllToGraph = () => {
    mutation.mutate(graphableEntities);
  };

  // Ensure there are entities that can be added to the graph
  const noGraphableEntities =
    graphableEntities.vertices.length + graphableEntities.edges.length === 0;
  if (noGraphableEntities) {
    return null;
  }

  return (
    <Button
      variant="filled"
      onClick={addAllToGraph}
      disabled={mutation.isPending}
      className="stack shrink-0 items-center justify-center rounded-full"
      {...props}
    >
      <Spinner loading={mutation.isPending}>Add All</Spinner>
    </Button>
  );
}

function EmptyResults() {
  return (
    <PanelEmptyState
      title="Empty Results"
      subtitle="Your query executed successfully, but the result was empty."
      icon={<ListIcon />}
      className="p-8"
    />
  );
}
