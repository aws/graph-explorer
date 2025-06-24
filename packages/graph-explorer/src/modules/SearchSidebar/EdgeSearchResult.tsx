import { Edge, useDisplayEdgeFromEdge } from "@/core";
import {
  ButtonProps,
  EdgeRow,
  IconButton,
  Spinner,
  stopPropagation,
} from "@/components";
import {
  useAddToGraphMutation,
  useDisplayVertexFromFragment,
  useHasEdgeBeenAddedToGraph,
  useRemoveEdgeFromGraph,
} from "@/hooks";
import { cn } from "@/utils";
import {
  ChevronRightIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useState } from "react";
import EntityAttribute from "../EntityDetails/EntityAttribute";
import { edgeDetailsQuery } from "@/connector";
import { useQuery } from "@tanstack/react-query";

export function EdgeSearchResult({ edge }: { edge: Edge }) {
  const [expanded, setExpanded] = useState(false);

  // Ensure the edge is fully materialized
  const { data: detailsResponse } = useQuery(edgeDetailsQuery(edge.id));
  const preferredEdge = detailsResponse?.edge ?? edge;
  const displayEdge = useDisplayEdgeFromEdge(preferredEdge);

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
    <div
      className={cn(
        "bg-background-default group w-full overflow-hidden transition-all"
      )}
      data-expanded={expanded}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        className="group-data-[expanded=true]:border-background-secondary group flex w-full flex-row items-center gap-2 p-3 text-left ring-0 hover:cursor-pointer"
      >
        <div>
          <ChevronRightIcon className="text-primary-dark/50 size-5 transition-transform duration-200 ease-in-out group-data-[expanded=true]:rotate-90" />
        </div>
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
    </div>
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
