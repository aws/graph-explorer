import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";

import type { PatchedResultEdge } from "@/connector/entities";

import {
  type ButtonProps,
  CollapsibleContent,
  EdgeRow,
  IconButton,
  SearchResultCollapsible,
  SearchResultCollapsibleTrigger,
  Spinner,
  stopPropagation,
} from "@/components";
import {
  createEdge,
  createVertex,
  useDisplayEdgeFromEdge,
  useDisplayVertex,
} from "@/core";
import {
  useAddToGraphMutation,
  useHasEdgeBeenAddedToGraph,
  useRemoveEdgeFromGraph,
} from "@/hooks";

import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";
import { useEdgeAttributesAsScalars } from "./useEdgeAttributesAsScalars";

export function EdgeSearchResult({
  edge,
  level = 0,
}: {
  edge: PatchedResultEdge;
  level?: number;
}) {
  const displayEdge = useDisplayEdgeFromEdge(
    createEdge({
      ...edge,
      sourceId: edge.source.id,
      targetId: edge.target.id,
    }),
  );

  // Get the display vertices
  const source = useDisplayVertex(displayEdge.sourceId);
  const target = useDisplayVertex(displayEdge.targetId);
  const hasBeenAdded = useHasEdgeBeenAddedToGraph(edge.id);
  const attributes = useEdgeAttributesAsScalars(displayEdge);

  return (
    <SearchResultCollapsible level={level} highlighted={hasBeenAdded}>
      <SearchResultCollapsibleTrigger>
        <EdgeRow
          edge={displayEdge}
          source={source}
          target={target}
          name={edge.name}
          className="grow"
        />
        <AddOrRemoveButton edge={edge} />
      </SearchResultCollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-3 p-3">
          {attributes.map(attr => (
            <li key={createEntityKey(attr, level + 1)} className="w-full">
              <EntitySearchResult entity={attr} level={level + 1} />
            </li>
          ))}
          <li>
            <EntitySearchResult entity={edge.source} level={level + 1} />
          </li>
          <li>
            <EntitySearchResult entity={edge.target} level={level + 1} />
          </li>
        </ul>
      </CollapsibleContent>
    </SearchResultCollapsible>
  );
}

function AddOrRemoveButton({
  edge,
  ...props
}: ButtonProps & { edge: PatchedResultEdge }) {
  const mutation = useAddToGraphMutation();
  const addToGraph = () =>
    mutation.mutate({
      edges: [
        createEdge({
          ...edge,
          sourceId: edge.source.id,
          targetId: edge.target.id,
        }),
      ],
      vertices: [createVertex(edge.source), createVertex(edge.target)],
    });
  const removeFromGraph = useRemoveEdgeFromGraph(edge.id);
  const hasBeenAdded = useHasEdgeBeenAddedToGraph(edge.id);

  if (hasBeenAdded) {
    return (
      <IconButton
        icon={<MinusCircleIcon />}
        variant="text"
        className="rounded-full"
        size="small"
        onClick={stopPropagation(removeFromGraph)}
        tooltipText="Remove edge from view"
        {...props}
      />
    );
  }

  return (
    <IconButton
      variant="text"
      className="rounded-full"
      size="small"
      onClick={stopPropagation(addToGraph)}
      disabled={mutation.isPending}
      tooltipText="Add edge to view"
      {...props}
    >
      {mutation.isPending ? <Spinner /> : <PlusCircleIcon />}
    </IconButton>
  );
}
