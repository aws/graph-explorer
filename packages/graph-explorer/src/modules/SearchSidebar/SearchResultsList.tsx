import { Button, ButtonProps, PanelFooter, Spinner } from "@/components";
import { MappedQueryResults } from "@/connector";
import { NodeSearchResult } from "./NodeSearchResult";
import { useAddToGraphMutation } from "@/hooks/useAddToGraph";
import { EdgeSearchResult } from "./EdgeSearchResult";
import { ScalarSearchResult } from "./ScalarSearchResult";
import { Edge, Vertex } from "@/core";
import { cn } from "@/utils";

export function SearchResultsList(results: MappedQueryResults) {
  // Combine all result types into a single list
  const allRows = createRows(results);

  return (
    <>
      <div className="bg-background-contrast/35 flex grow flex-col p-3">
        <ul className="border-divider flex flex-col overflow-hidden rounded-xl border shadow">
          {allRows.map(row => (
            <li
              key={row.key}
              className="border-divider content-auto intrinsic-size-16 border-b last:border-0"
            >
              {row.render()}
            </li>
          ))}
        </ul>
      </div>

      <PanelFooter className="sticky bottom-0 flex flex-row items-center justify-between gap-2">
        <AddAllToGraphButton
          vertices={results.vertices}
          edges={results.edges}
        />
        <div className="flex items-center gap-2">
          <ResultCounts results={results} />
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

/** Create a list of functions that render a row for each result type */
function createRows({ vertices, edges, scalars }: MappedQueryResults) {
  return vertices
    .map(entity => ({
      key: `node:${entity.type}:${entity.id}`,
      render: () => <NodeSearchResult node={entity} />,
    }))
    .concat(
      edges.map(entity => ({
        key: `edge:${entity.type}:${entity.id}`,
        render: () => <EdgeSearchResult edge={entity} />,
      }))
    )
    .concat(
      scalars.map((entity, index) => ({
        key: `scalar:${String(entity)}:${index}`,
        render: () => <ScalarSearchResult scalar={entity} />,
      }))
    );
}

function AddAllToGraphButton({
  vertices,
  edges,
  ...props
}: ButtonProps & { vertices: Vertex[]; edges: Edge[] }) {
  const mutation = useAddToGraphMutation();
  const canSendToGraph = vertices.length > 0 || edges.length > 0;
  const counts = vertices.length + edges.length;

  if (counts === 0) {
    return null;
  }

  return (
    <Button
      onClick={() => mutation.mutate({ vertices, edges })}
      disabled={!canSendToGraph || mutation.isPending}
      className="stack shrink-0 items-center justify-center"
      {...props}
    >
      <span className={cn("visible", mutation.isPending && "invisible")}>
        Add All ({counts})
      </span>
      <span
        className={cn("invisible", mutation.isPending && "visible mx-auto")}
      >
        <Spinner />
      </span>
    </Button>
  );
}
