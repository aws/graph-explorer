import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";

import type { PatchedResultVertex } from "@/connector/entities";

import {
  Button,
  type ButtonProps,
  CollapsibleContent,
  SearchResultCollapsible,
  SearchResultCollapsibleTrigger,
  Spinner,
  stopPropagation,
  VertexRow,
} from "@/components";
import { createVertex, useDisplayVertexFromVertex } from "@/core";
import {
  useAddToGraphMutation,
  useHasVertexBeenAddedToGraph,
  useRemoveNodeFromGraph,
} from "@/hooks";

import { createEntityKey, EntitySearchResult } from "./EntitySearchResult";
import { useVertexAttributesAsScalars } from "./useVertexAttributesAsScalars";

export function VertexSearchResult({
  vertex,
  level = 0,
}: {
  vertex: PatchedResultVertex;
  level?: number;
}) {
  const displayNode = useDisplayVertexFromVertex(createVertex(vertex));
  const hasBeenAdded = useHasVertexBeenAddedToGraph(vertex.id);
  const attributes = useVertexAttributesAsScalars(displayNode);

  return (
    <SearchResultCollapsible level={level} highlighted={hasBeenAdded}>
      <SearchResultCollapsibleTrigger>
        <VertexRow vertex={displayNode} name={vertex.name} className="grow" />
        <AddOrRemoveButton vertex={vertex} />
      </SearchResultCollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-3 p-3">
          {attributes.map(attr => (
            <li key={createEntityKey(attr, level + 1)} className="w-full">
              <EntitySearchResult entity={attr} level={level + 1} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </SearchResultCollapsible>
  );
}

function AddOrRemoveButton({
  vertex,
  ...props
}: ButtonProps & { vertex: PatchedResultVertex }) {
  const mutation = useAddToGraphMutation();
  const addToGraph = () =>
    mutation.mutate({ vertices: [createVertex(vertex)] });

  const removeFromGraph = useRemoveNodeFromGraph(vertex.id);
  const hasBeenAdded = useHasVertexBeenAddedToGraph(vertex.id);

  if (hasBeenAdded) {
    return (
      <Button
        variant="ghost"
        className="rounded-full"
        size="icon-small"
        onClick={stopPropagation(removeFromGraph)}
        tooltip="Remove node from view"
        {...props}
      >
        <MinusCircleIcon />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className="rounded-full"
      size="icon-small"
      onClick={stopPropagation(addToGraph)}
      disabled={mutation.isPending}
      tooltip="Add node to view"
      {...props}
    >
      {mutation.isPending ? <Spinner /> : <PlusCircleIcon />}
    </Button>
  );
}
