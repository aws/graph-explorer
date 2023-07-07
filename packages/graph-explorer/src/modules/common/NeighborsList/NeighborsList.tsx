import { cx } from "@emotion/css";
import { Vertex } from "../../../@types/entities";
import { Chip, Tooltip, VertexIcon, VisibleIcon } from "../../../components";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import useNeighborsOptions from "../../../hooks/useNeighborsOptions";
import defaultStyles from "./NeighborsList.styles";

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
      {neighborsOptions.map(op => {
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
    </div>
  );
};

export default NeighborsList;
