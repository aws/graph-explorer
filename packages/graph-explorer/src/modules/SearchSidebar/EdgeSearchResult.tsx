import { Edge, useDisplayEdgeFromEdge } from "@/core";
import {
  ButtonProps,
  EdgeRow,
  IconButton,
  SearchResult,
  SearchResultExpandChevron,
  Spinner,
  stopPropagation,
} from "@/components";
import {
  useAddToGraphMutation,
  useDisplayVertexFromFragment,
  useHasEdgeBeenAddedToGraph,
  useRemoveEdgeFromGraph,
} from "@/hooks";
import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import EntityAttribute from "../EntityDetails/EntityAttribute";

export function EdgeSearchResult({ edge }: { edge: Edge }) {
  const [expanded, setExpanded] = useState(false);

  const displayEdge = useDisplayEdgeFromEdge(edge);

  // Get the display vertices
  const source = useDisplayVertexFromFragment(
    displayEdge.source.id,
    displayEdge.source.types
  );
  const target = useDisplayVertexFromFragment(
    displayEdge.target.id,
    displayEdge.target.types
  );

  return (
    <SearchResult data-expanded={expanded}>
      <div
        onClick={() => setExpanded(e => !e)}
        className="group-data-[expanded=true]:border-background-secondary group flex w-full flex-row items-center gap-2 p-3 text-left ring-0 hover:cursor-pointer"
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
      <div className="border-border pl-8 transition-all group-data-[expanded=false]:h-0 group-data-[expanded=true]:h-auto group-data-[expanded=true]:border-t">
        <ul className="divide-y divide-gray-200">
          {displayEdge.attributes.map(attr => (
            <EntityAttribute
              key={attr.name}
              attribute={attr}
              className="px-3 py-2"
            />
          ))}
        </ul>
      </div>
    </SearchResult>
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
