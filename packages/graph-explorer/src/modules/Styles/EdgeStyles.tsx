import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import { Divider, NoEdgeTypesEmptyState } from "@/components";
import { useDisplayEdgeTypeConfigs } from "@/core";

import { EdgeStyleRow } from "./EdgeStyleRow";

/** Styling list for every edge type, shown on the Edges tab. */
export function EdgeStyles() {
  const etConfigs = useDisplayEdgeTypeConfigs().values().toArray();

  if (etConfigs.length === 0) {
    return <NoEdgeTypesEmptyState />;
  }

  return (
    <Virtuoso
      className="h-full grow"
      data={etConfigs}
      itemContent={(index, etConfig) => (
        <Fragment key={etConfig.type}>
          {index !== 0 ? <Divider /> : null}
          <EdgeStyleRow edgeType={etConfig.type} className="px-3 pt-2 pb-3" />
        </Fragment>
      )}
    />
  );
}
