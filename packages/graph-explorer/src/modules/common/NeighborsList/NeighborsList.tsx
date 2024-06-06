import { cx } from "@emotion/css";
import { Vertex } from "../../../@types/entities";
import {
  Chip,
  LoadingSpinner,
  PanelEmptyState,
  PanelError,
  Tooltip,
  VertexIcon,
  VisibleIcon,
} from "../../../components";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import useNeighborsOptions from "../../../hooks/useNeighborsOptions";
import defaultStyles from "./NeighborsList.styles";

export type NeighborsListProps = {
  classNamePrefix?: string;
  vertex: Vertex;
};

export default function NeighborsList({
  classNamePrefix = "ft",
  vertex,
}: NeighborsListProps) {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("section")
      )}
    >
      <Content classNamePrefix={classNamePrefix} vertex={vertex} />
    </div>
  );
}

function Content({ classNamePrefix = "ft", vertex }: NeighborsListProps) {
  const pfx = withClassNamePrefix(classNamePrefix);
  const query = useNeighborsOptions(vertex);

  if (query.isError) {
    return <PanelError error={query.error} onRetry={query.refetch} />;
  }

  if (!query.data) {
    return (
      <PanelEmptyState icon={<LoadingSpinner />} title={"Loading Neighbors"} />
    );
  }

  return (
    <>
      <div className={pfx("title")}>Neighbors ({query.data.totalCount})</div>
      {query.data.options.map(op => {
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
              <Tooltip text={`${op.addedCount} ${op.label} in the Graph View`}>
                <Chip className={pfx("chip")} startAdornment={<VisibleIcon />}>
                  {op.addedCount}
                </Chip>
              </Tooltip>
              <Chip className={pfx("chip")}>{op.totalCount}</Chip>
            </div>
          </div>
        );
      })}
    </>
  );
}
