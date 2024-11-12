import { Vertex } from "@/@types/entities";
import { Button, Tooltip, VertexSymbol } from "@/components";
import { useVertexTypeConfig } from "@/core/ConfigurationProvider/useConfiguration";
import {
  useAddToGraph,
  useHasNodeBeenAddedToGraph,
  useRemoveNodeFromGraph,
  useDisplayNames,
  useTextTransform,
} from "@/hooks";
import { cn } from "@/utils";
import {
  ChevronRightIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useState } from "react";

export function NodeSearchResult({ node }: { node: Vertex }) {
  const [expanded, setExpanded] = useState(false);
  const getDisplayNames = useDisplayNames();
  const textTransform = useTextTransform();

  const { name, longName } = getDisplayNames(node);

  const vtConfig = useVertexTypeConfig(node.type);
  const nodeType = vtConfig?.displayLabel || textTransform(node.type);

  const addToGraph = useAddToGraph(node);
  const removeFromGraph = useRemoveNodeFromGraph(node.id);
  const hasBeenAdded = useHasNodeBeenAddedToGraph(node.id);

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
        <div className="flex grow flex-row items-center gap-3">
          <VertexSymbol vtConfig={vtConfig} />
          <div className="flex grow flex-col items-start">
            <div className="text-base font-bold leading-snug">
              {nodeType} &rsaquo; {name}
            </div>
            <div className="text-text-secondary/90 line-clamp-2 text-base leading-snug">
              {longName}
            </div>
          </div>
        </div>
        <Tooltip
          text={hasBeenAdded ? "Remove from view" : "Add to view"}
          delayEnter={200}
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            {hasBeenAdded ? (
              <Button
                icon={<MinusCircleIcon />}
                variant="text"
                onPress={removeFromGraph}
              >
                <span className="sr-only">Remove from view</span>
              </Button>
            ) : (
              <Button
                icon={<PlusCircleIcon />}
                variant="text"
                onPress={addToGraph}
              >
                <span className="sr-only">Add to view</span>
              </Button>
            )}
          </div>
        </Tooltip>
      </div>
      <div className="border-background-secondary px-8 transition-all group-data-[expanded=false]:h-0 group-data-[expanded=true]:h-auto group-data-[expanded=true]:border-t">
        <ul>
          {Object.keys(node.attributes).map(attributeName => (
            <li
              key={attributeName}
              className="flex flex-col gap-1 border-b border-gray-200 px-3 py-2 last:border-0"
            >
              <div className="text-text-secondary text-sm">{attributeName}</div>
              <div className="text-text-primary">
                {node.attributes[attributeName]}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
