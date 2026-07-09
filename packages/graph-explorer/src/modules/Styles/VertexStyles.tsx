import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import { Divider, NoNodeTypesEmptyState } from "@/components";
import { useDisplayVertexTypeConfigs } from "@/core";

import { VertexStyleRow } from "./VertexStyleRow";

/** Styling list for every vertex type, shown on the Nodes tab. */
export function VertexStyles() {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();

  if (vtConfigs.length === 0) {
    return <NoNodeTypesEmptyState />;
  }

  return (
    <Virtuoso
      className="h-full grow"
      data={vtConfigs}
      itemContent={(index, vtConfig) => (
        <Fragment key={vtConfig.type}>
          {index !== 0 ? <Divider /> : null}
          <VertexStyleRow
            vertexType={vtConfig.type}
            className="px-3 pt-2 pb-3"
          />
        </Fragment>
      )}
    />
  );
}
