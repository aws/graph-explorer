import {
  createEdge,
  createVertex,
  PatchedResultEdge,
  useDisplayEdgeFromEdge,
  useDisplayVertex,
} from "@/core";
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
import { EntitySearchResult } from "./EntitySearchResult";

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
      sourceId: edge.sourceVertex.id,
      targetId: edge.targetVertex.id,
    })
  );

  // Get the display vertices
  const source = useDisplayVertex(displayEdge.sourceId);
  const target = useDisplayVertex(displayEdge.targetId);

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
            name={edge.name}
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
          <li>
            <EntitySearchResult entity={edge.sourceVertex} level={level + 1} />
          </li>
          <li>
            <EntitySearchResult entity={edge.targetVertex} level={level + 1} />
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
          sourceId: edge.sourceVertex.id,
          targetId: edge.targetVertex.id,
        }),
      ],
      vertices: [
        createVertex(edge.sourceVertex),
        createVertex(edge.targetVertex),
      ],
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
