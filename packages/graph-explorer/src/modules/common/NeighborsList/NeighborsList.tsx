import { cx } from "@emotion/css";
import { Vertex } from "../../../@types/entities";
import {
  Button,
  Chip,
  Tooltip,
  VertexIcon,
  VisibleIcon,
} from "../../../components";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import useNeighborsOptions from "../../../hooks/useNeighborsOptions";
import defaultStyles from "./NeighborsList.styles";
import { useState } from "react";

export type NeighborsListProps = {
  classNamePrefix?: string;
  vertex: Vertex;
};

const NeighborsList = ({
  classNamePrefix = "ft",
  vertex,
}: NeighborsListProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const neighborsOptions = useNeighborsOptions(vertex);
  const [showMore, setShowMore] = useState(false);
  const maxStartingItems = 5;
  const hasMore = neighborsOptions.length > maxStartingItems;
  const extraCount = hasMore ? neighborsOptions.length - maxStartingItems : 0;

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("section")
      )}
    >
      <div className={pfx("title")}>
        Neighbors ({vertex.data.neighborsCount})
      </div>
      {neighborsOptions.slice(0, showMore ? undefined : 5).map(op => {
        const neighborsInView =
          vertex.data.neighborsCountByType[op.value] -
          (vertex.data.__unfetchedNeighborCounts?.[op.value] ?? 0);
        return (
          <div key={op.value} className={pfx("node-item")}>
            <div className={pfx("vertex-type")}>
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
            <div className={pfx("vertex-totals")}>
              <Tooltip
                text={`${neighborsInView} ${op.label} in the Graph View`}
              >
                <Chip className={pfx("chip")} startAdornment={<VisibleIcon />}>
                  {neighborsInView}
                </Chip>
              </Tooltip>
              <Chip className={pfx("chip")}>
                {vertex.data.neighborsCountByType[op.value]}
              </Chip>
            </div>
          </div>
        );
      })}

      {hasMore ? (
        <Button variant="text" onPress={() => setShowMore(prev => !prev)}>
          {showMore
            ? `Hide ${extraCount} additional neighbors`
            : `Show ${extraCount} additional neighbors`}
        </Button>
      ) : null}
    </div>
  );
};

export default NeighborsList;
