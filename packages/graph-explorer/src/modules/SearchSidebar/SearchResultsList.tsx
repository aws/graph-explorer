import {
  Button,
  ButtonProps,
  IconButton,
  PanelFooter,
  Spinner,
} from "@/components";
import { useAddToGraphMutation } from "@/hooks/useAddToGraph";
import { ChevronLeftIcon, ChevronRightIcon, ListPlusIcon } from "lucide-react";
import { getAllGraphableEntities, PatchedResultEntity } from "@/core";
import { useState } from "react";
import { cn } from "@/utils";
import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";

export function SearchResultsList({
  results,
}: {
  results: PatchedResultEntity[];
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

  const currentPageRows = results.slice(page * pageSize, (page + 1) * pageSize);

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
        <AddAllToGraphButton entities={results} />
        <div className="flex min-h-10 grow items-center justify-end gap-2">
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

function ResultCounts({ results }: { results: PatchedResultEntity[] }) {
  const count = results.length;
  const label = count === 1 ? `${count} Item` : `${count} Items`;

  return <p className="text-text-secondary text-pretty text-sm">{label}</p>;
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
