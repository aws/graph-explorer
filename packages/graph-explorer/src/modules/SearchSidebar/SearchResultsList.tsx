import {
  Button,
  ButtonProps,
  IconButton,
  PanelFooter,
  Spinner,
} from "@/components";
import { MappedQueryResults } from "@/connector";
import { NodeSearchResult } from "./NodeSearchResult";
import { useAddToGraphMutation } from "@/hooks/useAddToGraph";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
} from "lucide-react";
import { EdgeSearchResult } from "./EdgeSearchResult";
import { ScalarSearchResult } from "./ScalarSearchResult";
import { Edge, Vertex } from "@/core";
import { useState } from "react";

export function SearchResultsList(results: MappedQueryResults) {
  const pageSize = 100;
  const [page, setPage] = useState(0);

  const counts = createCounts(results);

  // Combine all result types into a single list
  const allRows = createRows(results);

  const isPagingNecessary = allRows.length > pageSize;
  const onLastPage = (page + 1) * pageSize >= allRows.length;

  const currentPageRows = allRows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <div className="bg-background-contrast/35 flex grow flex-col p-3">
        <ul className="border-divider flex flex-col overflow-hidden rounded-xl border shadow">
          {currentPageRows.map(row => row())}
        </ul>
      </div>

      <PanelFooter className="sticky bottom-0 flex flex-row items-center justify-between">
        <AddAllToGraphButton
          vertices={results.vertices}
          edges={results.edges}
        />
        <div className="flex items-center gap-2">
          <div className="text-text-secondary text-sm">
            {counts || "No results"}
          </div>
          {isPagingNecessary ? (
            <div className="flex">
              <IconButton
                icon={<ChevronLeftIcon />}
                className="rounded-r-none"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              />
              <IconButton
                icon={<ChevronRightIcon />}
                className="rounded-l-none"
                onClick={() => setPage(page + 1)}
                disabled={onLastPage}
              />
            </div>
          ) : null}
        </div>
      </PanelFooter>
    </>
  );
}

/** Create a string of counts for the number of results of each type */
function createCounts({ vertices, edges, scalars }: MappedQueryResults) {
  return [
    vertices.length ? `${vertices.length} nodes` : null,
    edges.length ? `${edges.length} edges` : null,
    scalars.length ? `${scalars.length} values` : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

/** Create a list of functions that render a row for each result type */
function createRows({ vertices, edges, scalars }: MappedQueryResults) {
  return vertices
    .map(entity => () => (
      <li
        key={`node:${entity.type}:${entity.id}`}
        className="border-divider content-auto intrinsic-size-16 border-b last:border-0"
      >
        <NodeSearchResult node={entity} />
      </li>
    ))
    .concat(
      edges.map(entity => () => (
        <li
          key={`edge:${entity.type}:${entity.id}`}
          className="border-divider content-auto intrinsic-size-16 border-b last:border-0"
        >
          <EdgeSearchResult edge={entity} />
        </li>
      ))
    )
    .concat(
      scalars.map((entity, index) => () => (
        <li
          key={`scalar:${String(entity)}:${index}`}
          className="border-divider content-auto intrinsic-size-16 border-b last:border-0"
        >
          <ScalarSearchResult scalar={entity} />
        </li>
      ))
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
