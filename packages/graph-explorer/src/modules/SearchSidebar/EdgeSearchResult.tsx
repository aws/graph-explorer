import {
  createVertex,
  DisplayEdge,
  DisplayVertex,
  Edge,
  useDisplayEdgeFromEdge,
  useDisplayVertexFromVertex,
} from "@/core";
import {
  Button,
  EdgeRow,
  stopPropagation,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components";
import {
  useAddEdgeToGraph,
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

export function EdgeSearchResult({ edge }: { edge: Edge }) {
  const [expanded, setExpanded] = useState(false);
  const displayEdge = useDisplayEdgeFromEdge(edge);
  const sourceVertex = useDisplayForEdgeVertex(displayEdge.source);
  const targetVertex = useDisplayForEdgeVertex(displayEdge.target);

  const addToGraph = useAddEdgeToGraph(edge);
  const removeFromGraph = useRemoveEdgeFromGraph(edge.id);
  const hasBeenAdded = useHasEdgeBeenAddedToGraph(edge.id);

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
          source={sourceVertex}
          target={targetVertex}
          className="grow"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex size-8 shrink-0 items-center justify-center">
              {hasBeenAdded ? (
                <Button
                  icon={<MinusCircleIcon />}
                  variant="text"
                  onClick={stopPropagation(removeFromGraph)}
                >
                  <span className="sr-only">Remove edge from view</span>
                </Button>
              ) : (
                <Button
                  icon={<PlusCircleIcon />}
                  variant="text"
                  onClick={stopPropagation(addToGraph)}
                >
                  <span className="sr-only">Add edge to view</span>
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {hasBeenAdded ? "Remove edge from view" : "Add edge to view"}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="border-background-secondary px-8 transition-all group-data-[expanded=false]:h-0 group-data-[expanded=true]:h-auto group-data-[expanded=true]:border-t">
        <ul>
          {displayEdge.attributes.map(attr => (
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

/**
 * Creates a fragment vertex in order to get a DisplayVertex instance for the
 * edge vertex.
 *
 * NOTE: This should be replaced by logic that fetches the full vertex details.
 */
function useDisplayForEdgeVertex(
  edgeVertex: DisplayEdge["source"]
): DisplayVertex {
  // TODO: Fetch the vertex details to display the proper display name in the EdgeRow
  const fragment = createVertex(edgeVertex);
  const result = useDisplayVertexFromVertex(fragment);
  return {
    ...result,
    displayName: edgeVertex.displayId,
  };
}
