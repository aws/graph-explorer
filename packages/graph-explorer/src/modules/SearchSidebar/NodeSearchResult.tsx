import { Vertex } from "@/core";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VertexRow,
} from "@/components";
import {
  useAddToGraph,
  useHasVertexBeenAddedToGraph,
  useRemoveNodeFromGraph,
} from "@/hooks";
import { cn } from "@/utils";
import {
  ChevronRightIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { useDisplayVertexFromVertex } from "@/core";
import EntityAttribute from "../EntityDetails/EntityAttribute";

export function NodeSearchResult({ node }: { node: Vertex }) {
  const [expanded, setExpanded] = useState(false);
  const displayNode = useDisplayVertexFromVertex(node);

  const addToGraph = useAddToGraph(node);
  const removeFromGraph = useRemoveNodeFromGraph(node.id);
  const hasBeenAdded = useHasVertexBeenAddedToGraph(node.id);

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
        <VertexRow vertex={displayNode} className="grow" />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex size-8 shrink-0 items-center justify-center">
              {hasBeenAdded ? (
                <Button
                  icon={<MinusCircleIcon />}
                  variant="text"
                  onPress={removeFromGraph}
                >
                  <span className="sr-only">Remove node from view</span>
                </Button>
              ) : (
                <Button
                  icon={<PlusCircleIcon />}
                  variant="text"
                  onPress={addToGraph}
                >
                  <span className="sr-only">Add node to view</span>
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {hasBeenAdded ? "Remove node from view" : "Add node to view"}
          </TooltipContent>
        </Tooltip>
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
