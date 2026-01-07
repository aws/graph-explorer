import { createVertex, useDisplayVertexFromVertex } from "@/core";
import {
  type ButtonProps,
  CollapsibleContent,
  IconButton,
  SearchResultCollapsible,
  SearchResultCollapsibleTrigger,
  Spinner,
  stopPropagation,
  VertexRow,
} from "@/components";
import {
  useAddToGraphMutation,
  useHasVertexBeenAddedToGraph,
  useRemoveNodeFromGraph,
} from "@/hooks";
import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";
import type { PatchedResultVertex } from "@/connector/entities";
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
      <IconButton
        icon={<MinusCircleIcon />}
        variant="text"
        className="rounded-full"
        size="small"
        onClick={stopPropagation(removeFromGraph)}
        tooltipText="Remove node from view"
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
      tooltipText="Add node to view"
      {...props}
    >
      {mutation.isPending ? <Spinner /> : <PlusCircleIcon />}
    </IconButton>
  );
}
