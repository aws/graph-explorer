import { cn } from "@/utils";
import { VertexId } from "@/@types/entities";
import {
  Button,
  Chip,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VertexIcon,
  VisibleIcon,
} from "@/components";
import { useNode, useWithTheme } from "@/core";
import useNeighborsOptions from "@/hooks/useNeighborsOptions";
import defaultStyles from "./NeighborsList.styles";
import { useState } from "react";
import { useQueryEngine } from "@/core/connector";

export type NeighborsListProps = {
  id: VertexId;
};

const MAX_NEIGHBOR_TYPE_ROWS = 5;

export default function NeighborsList({ id }: NeighborsListProps) {
  const styleWithTheme = useWithTheme();
  const vertex = useNode(id);
  const neighborsOptions = useNeighborsOptions(vertex);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className={cn(styleWithTheme(defaultStyles), "section")}>
      <div className="title">Neighbors ({vertex.neighborsCount})</div>
      {neighborsOptions
        .slice(0, showMore ? undefined : MAX_NEIGHBOR_TYPE_ROWS)
        .map(op => {
          const neighborsInView =
            vertex.neighborsCountByType[op.value] -
            (vertex.__unfetchedNeighborCounts?.[op.value] ?? 0);
          return (
            <div key={op.value} className="node-item">
              <div className="vertex-type">
                <VertexIcon vertexStyle={op.config.style} />
                {op.label}
              </div>
              <div className="vertex-totals">
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
        })}

      <ExpandToggleButton
        itemCount={neighborsOptions.length}
        expanded={showMore}
        toggle={() => setShowMore(prev => !prev)}
      />
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
