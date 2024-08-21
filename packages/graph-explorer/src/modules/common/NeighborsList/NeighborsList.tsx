import { cx } from "@emotion/css";
import { Vertex } from "@/@types/entities";
import { Button, Chip, Tooltip, VertexIcon, VisibleIcon } from "@/components";
import { useWithTheme } from "@/core";
import useNeighborsOptions from "@/hooks/useNeighborsOptions";
import defaultStyles from "./NeighborsList.styles";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { activeConnectionSelector } from "@/core/connector";

export type NeighborsListProps = {
  vertex: Vertex;
};

const MAX_NEIGHBOR_TYPE_ROWS = 5;

export default function NeighborsList({ vertex }: NeighborsListProps) {
  const styleWithTheme = useWithTheme();
  const neighborsOptions = useNeighborsOptions(vertex);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className={cx(styleWithTheme(defaultStyles), "section")}>
      <div className={"title"}>Neighbors ({vertex.data.neighborsCount})</div>
      {neighborsOptions
        .slice(0, showMore ? undefined : MAX_NEIGHBOR_TYPE_ROWS)
        .map(op => {
          const neighborsInView =
            vertex.data.neighborsCountByType[op.value] -
            (vertex.data.__unfetchedNeighborCounts?.[op.value] ?? 0);
          return (
            <div key={op.value} className={"node-item"}>
              <div className={"vertex-type"}>
                <div
                  style={{
                    color: op.config?.color,
                  }}
                >
                  <VertexIcon
                    iconUrl={op.config?.iconUrl}
                    iconImageType={op.config?.iconImageType}
                  />
                </div>
                {op.label}
              </div>
              <div className={"vertex-totals"}>
                <Tooltip
                  text={`${neighborsInView} ${op.label} in the Graph View`}
                >
                  <Chip className={"chip"} startAdornment={<VisibleIcon />}>
                    {neighborsInView}
                  </Chip>
                </Tooltip>
                <Chip className={"chip"}>
                  {vertex.data.neighborsCountByType[op.value]}
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

  const connection = useRecoilValue(activeConnectionSelector);
  const nodeTypeLabel =
    connection?.queryEngine === "sparql" ? "classes" : "labels";

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
