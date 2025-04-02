import { useDisplayVertexFromVertex, Vertex } from "@/core";
import {
  ButtonProps,
  IconButton,
  Spinner,
  stopPropagation,
  VertexRow,
} from "@/components";
import {
  useAddToGraphMutation,
  useHasVertexBeenAddedToGraph,
  useRemoveNodeFromGraph,
  useVertexDetailsQuery,
} from "@/hooks";
import {
  ChevronRightIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useState } from "react";
import EntityAttribute from "../EntityDetails/EntityAttribute";

export function NodeSearchResult({ node }: { node: Vertex }) {
  const [expanded, setExpanded] = useState(false);

  const { data: detailsResponse } = useVertexDetailsQuery(node.id);
  const preferredNode = detailsResponse?.vertex ?? node;
  const displayNode = useDisplayVertexFromVertex(preferredNode);

  return (
    <div
      className="bg-background-default group w-full overflow-hidden transition-all"
      data-expanded={expanded}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        className="group-data-[expanded=true]:border-background-secondary group flex w-full flex-row items-center gap-2 p-3 text-left ring-0 hover:cursor-pointer"
      >
        <div>
          <ChevronRightIcon className="text-primary-dark/50 size-5 transition-transform duration-200 ease-in-out group-data-[expanded=true]:rotate-90" />
        </div>
        <VertexRow vertex={displayNode} className="grow" />
        <AddOrRemoveButton vertex={preferredNode} />
      </div>
      <div className="border-background-secondary px-8 transition-all group-data-[expanded=false]:h-0 group-data-[expanded=true]:h-auto group-data-[expanded=true]:border-t">
        <ul>
          {displayNode.attributes.map(attr => (
            <EntityAttribute
              key={attr.name}
              attribute={attr}
              className="border-b border-gray-200 px-3 py-2 last:border-0"
            />
          ))}
        </ul>
      </div>
    </div>
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
