import { cn } from "@/utils";
import { Vertex, VertexId } from "@/@types/entities";
import {
  Button,
  Chip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VertexIcon,
  VisibleIcon,
} from "@/components";
import { useNode } from "@/core";
import useNeighborsOptions, {
  NeighborOption,
} from "@/hooks/useNeighborsOptions";
import { ComponentPropsWithoutRef, useState } from "react";
import { useQueryEngine } from "@/core/connector";

export type NeighborsListProps = {
  id: VertexId;
} & ComponentPropsWithoutRef<"div">;

const MAX_NEIGHBOR_TYPE_ROWS = 5;

export default function NeighborsList({
  id,
  className,
  ...props
}: NeighborsListProps) {
  const vertex = useNode(id);
  const neighborsOptions = useNeighborsOptions(vertex);
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      className={cn("flex flex-col gap-3 border-b p-3", className)}
      {...props}
    >
      <div className="font-bold">Neighbors ({vertex.neighborsCount})</div>
      <ul className="flex flex-col gap-3">
        {neighborsOptions
          .slice(0, showMore ? undefined : MAX_NEIGHBOR_TYPE_ROWS)
          .map(op => (
            <li key={op.value}>
              <NeighborTypeRow vertex={vertex} op={op} />
            </li>
          ))}
      </ul>

      <ExpandToggleButton
        itemCount={neighborsOptions.length}
        expanded={showMore}
        toggle={() => setShowMore(prev => !prev)}
      />
    </div>
  );
}

function NeighborTypeRow({
  vertex,
  op,
}: {
  vertex: Vertex;
  op: NeighborOption;
}) {
  const neighborsInView =
    vertex.neighborsCountByType[op.value] -
    (vertex.__unfetchedNeighborCounts?.[op.value] ?? 0);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 font-medium">
        <VertexIcon vertexStyle={op.config.style} />
        {op.label}
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Chip className="min-w-12">
              <VisibleIcon />
              {neighborsInView}
            </Chip>
          </TooltipTrigger>
          <TooltipContent>
            {`${neighborsInView} ${op.label} in the Graph View`}
          </TooltipContent>
        </Tooltip>
        <Chip className="min-w-12">
          {vertex.neighborsCountByType[op.value]}
        </Chip>
      </div>
    </div>
  );
}

function ExpandToggleButton({
  itemCount,
  expanded,
  toggle,
}: {
  itemCount: number;
  expanded: boolean;
  toggle: () => void;
}) {
  const hasMore = itemCount > MAX_NEIGHBOR_TYPE_ROWS;
  const extraCount = hasMore ? itemCount - MAX_NEIGHBOR_TYPE_ROWS : 0;

  const queryEngine = useQueryEngine();
  const nodeTypeLabel = queryEngine === "sparql" ? "classes" : "labels";

  if (!hasMore) {
    return null;
  }

  return (
    <Button variant="text" onPress={() => toggle()}>
      {expanded
        ? `Hide ${extraCount} additional neighbor ${nodeTypeLabel}`
        : `Show ${extraCount} additional neighbor ${nodeTypeLabel}`}
    </Button>
  );
}
