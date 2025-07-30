import { useDisplayVertexFromVertex, Vertex } from "@/core";
import {
  ButtonProps,
  CollapsibleContent,
  CollapsibleTrigger,
  IconButton,
  SearchResultAttribute,
  SearchResultAttributeName,
  SearchResultAttributeValue,
  SearchResultCollapsible,
  SearchResultExpandChevron,
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
import { useState } from "react";

export function VertexSearchResult({
  vertex,
  level = 0,
}: {
  vertex: Vertex;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayNode = useDisplayVertexFromVertex(vertex);

  return (
    <SearchResultCollapsible
      level={level}
      open={expanded}
      onOpenChange={setExpanded}
    >
      <CollapsibleTrigger asChild>
        <div
          role="button"
          className="flex w-full flex-row items-center gap-2 p-3 text-left hover:cursor-pointer"
        >
          <SearchResultExpandChevron open={expanded} />
          <VertexRow vertex={displayNode} className="grow" />
          <AddOrRemoveButton vertex={vertex} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-3 p-3">
          {displayNode.attributes.map(attr => (
            <li key={attr.name} className="w-full">
              <SearchResultAttribute>
                <SearchResultAttributeName>
                  {attr.name}
                </SearchResultAttributeName>
                <SearchResultAttributeValue>
                  {attr.displayValue}
                </SearchResultAttributeValue>
              </SearchResultAttribute>
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
}: ButtonProps & { vertex: Vertex }) {
  const mutation = useAddToGraphMutation();
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
      onClick={stopPropagation(() => mutation.mutate({ vertices: [vertex] }))}
      disabled={mutation.isPending}
      tooltipText="Add node to view"
      {...props}
    >
      {mutation.isPending ? <Spinner /> : <PlusCircleIcon />}
    </IconButton>
  );
}
