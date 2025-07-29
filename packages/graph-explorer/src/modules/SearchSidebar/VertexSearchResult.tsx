import { useDisplayVertexFromVertex, Vertex } from "@/core";
import {
  ButtonProps,
  IconButton,
  SearchResult,
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
import EntityAttribute from "../EntityDetails/EntityAttribute";

export function VertexSearchResult({ vertex }: { vertex: Vertex }) {
  const [expanded, setExpanded] = useState(false);

  const displayNode = useDisplayVertexFromVertex(vertex);

  return (
    <SearchResult data-expanded={expanded}>
      <div
        onClick={() => setExpanded(e => !e)}
        className="group-data-[expanded=true]:border-background-secondary group flex w-full flex-row items-center gap-2 p-3 text-left ring-0 hover:cursor-pointer"
      >
        <SearchResultExpandChevron />
        <VertexRow vertex={displayNode} className="grow" />
        <AddOrRemoveButton vertex={vertex} />
      </div>
      <div className="border-border pl-8 transition-all group-data-[expanded=false]:h-0 group-data-[expanded=true]:h-auto group-data-[expanded=true]:border-t">
        <ul className="divide-y divide-gray-200">
          {displayNode.attributes.map(attr => (
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
