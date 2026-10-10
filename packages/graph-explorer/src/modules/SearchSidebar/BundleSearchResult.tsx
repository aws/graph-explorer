import { useAtomValue } from "jotai";
import { BracketsIcon, MinusCircleIcon, PlusCircleIcon } from "lucide-react";

import {
  Button,
  type ButtonProps,
  CollapsibleContent,
  SearchResultCollapsible,
  SearchResultCollapsibleTrigger,
  SearchResultSubtitle,
  SearchResultSymbol,
  SearchResultTitle,
  Spinner,
  stopPropagation,
} from "@/components";
import {
  getAllGraphableEntities,
  getDisplayValueForBundle,
  type PatchedResultBundle,
} from "@/connector/entities";
import { edgesAtom, nodesAtom } from "@/core";
import {
  useAddToGraphMutation,
  useRemoveFromGraph,
  useTextTransform,
} from "@/hooks";

import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";

export function BundleSearchResult({
  bundle,
  level = 0,
}: {
  bundle: PatchedResultBundle;
  level?: number;
}) {
  const textTransformer = useTextTransform();
  const title = bundle.name ? textTransformer(bundle.name) : bundle.name;
  const subtitle = getDisplayValueForBundle(bundle, textTransformer);

  return (
    <SearchResultCollapsible level={level}>
      <SearchResultCollapsibleTrigger>
        <SearchResultSymbol className="bg-primary/20 text-primary rounded-lg">
          <BracketsIcon className="size-5" />
        </SearchResultSymbol>
        <div className="grow">
          {title && <SearchResultTitle>{title}</SearchResultTitle>}
          <SearchResultSubtitle>{subtitle}</SearchResultSubtitle>
        </div>
        <AddOrRemoveAllButton bundle={bundle} />
      </SearchResultCollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-3 p-3">
          {bundle.values.map(entity => (
            <li key={createEntityKey(entity, level + 1)}>
              <EntitySearchResult entity={entity} level={level + 1} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </SearchResultCollapsible>
  );
}

/**
 * Adds or removes all the graphable entities (vertices and edges) contained
 * within a bundle, including nested bundles.
 *
 * - Hidden entirely when the bundle contains no graphable entities.
 * - Shows an add button when any entity in the bundle is missing from the
 *   graph. Clicking it adds the remaining entities (already-added ones are
 *   left untouched).
 * - Shows a remove button once every entity in the bundle has been added.
 *   Clicking it removes all of them from the graph.
 */
function AddOrRemoveAllButton({
  bundle,
  ...props
}: ButtonProps & { bundle: PatchedResultBundle }) {
  const graphableEntities = getAllGraphableEntities(bundle.values);
  const vertexIds = graphableEntities.vertices.map(vertex => vertex.id);
  const edgeIds = graphableEntities.edges.map(edge => edge.id);

  const nodesInGraph = useAtomValue(nodesAtom);
  const edgesInGraph = useAtomValue(edgesAtom);

  const mutation = useAddToGraphMutation();
  const removeFromGraph = useRemoveFromGraph();

  const hasGraphableEntities = vertexIds.length + edgeIds.length > 0;
  if (!hasGraphableEntities) {
    return null;
  }

  const allAdded =
    vertexIds.every(id => nodesInGraph.has(id)) &&
    edgeIds.every(id => edgesInGraph.has(id));

  if (allAdded) {
    const removeAllFromGraph = () =>
      removeFromGraph({ vertices: vertexIds, edges: edgeIds });

    return (
      <Button
        variant="ghost"
        className="rounded-full"
        size="icon-small"
        onClick={stopPropagation(removeAllFromGraph)}
        tooltip="Remove all from view"
        {...props}
      >
        <MinusCircleIcon />
      </Button>
    );
  }

  const addAllToGraph = () => mutation.mutate(graphableEntities);

  return (
    <Button
      variant="ghost"
      className="rounded-full"
      size="icon-small"
      onClick={stopPropagation(addAllToGraph)}
      disabled={mutation.isPending}
      tooltip="Add all to view"
      {...props}
    >
      {mutation.isPending ? <Spinner /> : <PlusCircleIcon />}
    </Button>
  );
}
