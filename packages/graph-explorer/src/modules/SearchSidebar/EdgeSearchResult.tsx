import { Edge, useDisplayEdgeFromEdge, useDisplayVertex } from "@/core";
import {
  ButtonProps,
  CollapsibleContent,
  CollapsibleTrigger,
  EdgeRow,
  IconButton,
  SearchResultAttribute,
  SearchResultAttributeName,
  SearchResultAttributeValue,
  SearchResultCollapsible,
  SearchResultExpandChevron,
  Spinner,
  stopPropagation,
} from "@/components";
import {
  useAddToGraphMutation,
  useHasEdgeBeenAddedToGraph,
  useRemoveEdgeFromGraph,
} from "@/hooks";
import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";

export function EdgeSearchResult({
  edge,
  level = 0,
}: {
  edge: Edge;
  level?: number;
}) {
  const displayEdge = useDisplayEdgeFromEdge(edge);

  // Get the display vertices
  const source = useDisplayVertex(displayEdge.source);
  const target = useDisplayVertex(displayEdge.target);

  return (
    <SearchResultCollapsible level={level}>
      <CollapsibleTrigger asChild>
        <div
          role="button"
          className="flex w-full flex-row items-center gap-2 p-3 text-left hover:cursor-pointer"
        >
          <SearchResultExpandChevron />
          <EdgeRow
            edge={displayEdge}
            source={source}
            target={target}
            className="grow"
          />
          <AddOrRemoveButton edge={edge} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-3 p-3">
          {displayEdge.attributes.map(attr => (
            <li key={attr.name} className="w-full">
              <SearchResultAttribute level={level + 1}>
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

function AddOrRemoveButton({ edge, ...props }: ButtonProps & { edge: Edge }) {
  const mutation = useAddToGraphMutation();
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
      onClick={stopPropagation(() => mutation.mutate({ edges: [edge] }))}
      disabled={mutation.isPending}
      tooltipText="Add edge to view"
      {...props}
    >
      {mutation.isPending ? <Spinner /> : <PlusCircleIcon />}
    </IconButton>
  );
}
