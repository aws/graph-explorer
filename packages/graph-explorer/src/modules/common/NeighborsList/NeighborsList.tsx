import { cn } from "@/utils";
import {
  type VertexId,
  useNeighbors,
  useNeighborByType as useNeighborsByType,
  useVertexPreferences,
  createVertexType,
} from "@/core";
import {
  Button,
  Chip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VertexIcon,
} from "@/components";
import useNeighborsOptions, {
  type NeighborOption,
} from "@/hooks/useNeighborsOptions";
import { type ComponentPropsWithoutRef, useState } from "react";
import { useQueryEngine } from "@/core/connector";
import { EyeIcon } from "lucide-react";

export type NeighborsListProps = {
  vertexId: VertexId;
} & ComponentPropsWithoutRef<"div">;

const MAX_NEIGHBOR_TYPE_ROWS = 5;

export default function NeighborsList({
  vertexId,
  className,
  ...props
}: NeighborsListProps) {
  const neighbors = useNeighbors(vertexId);
  const neighborsOptions = useNeighborsOptions(vertexId);
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      className={cn("space-y-[1.125rem] border-b p-3", className)}
      {...props}
    >
      <div className="text-lg font-bold">Neighbors ({neighbors.all})</div>
      <ul className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-3">
        {neighborsOptions
          .slice(0, showMore ? undefined : MAX_NEIGHBOR_TYPE_ROWS)
          .map(op => (
            <li key={op.value} className="contents">
              <NeighborTypeRow vertexId={vertexId} op={op} />
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
  vertexId,
  op,
}: {
  vertexId: VertexId;
  op: NeighborOption;
}) {
  const neighbors = useNeighborsByType(vertexId, createVertexType(op.value));
  const vertexPreferences = useVertexPreferences(op.config.type);

  return (
    <>
      <span className="flex items-center gap-2 font-medium break-all">
        <VertexIcon vertexStyle={vertexPreferences} />
        {op.label}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Chip className="min-w-12">
            <EyeIcon />
            {neighbors.fetched}
          </Chip>
        </TooltipTrigger>
        <TooltipContent>
          {`${neighbors.fetched} ${op.label} in the Graph View`}
        </TooltipContent>
      </Tooltip>
      <Chip className="min-w-12">{neighbors.all}</Chip>
    </>
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
