import type { Vertex } from "../../../@types/entities";
import type { ConfigurationContextProps } from "../../../core";
import type { NeighborsCountResponse } from "../../AbstractConnector";
import type { GVertex } from "../types";
import parsePropertiesValues from "./parsePropertiesValues";

const mapApiVertex = (
  config: ConfigurationContextProps,
  apiVertex: GVertex,
  neighborsCount?: NeighborsCountResponse
): Vertex => {
  const labels = apiVertex["@value"].label.split("::");
  const vt = labels[0];
  const vertexConfig = config.schema?.vertices.find(
    vertex => vertex.type === vt
  );

  return {
    data: {
      id: apiVertex["@value"].id,
      __v_id: apiVertex["@value"].id,
      __v_type: vt,
      __v_types: labels,
      __v_type_display: vertexConfig?.displayLabel || apiVertex["@value"].label,
      __isHidden: vertexConfig?.hidden,
      __totalNeighborCount: neighborsCount?.totalCount || 0,
      __totalNeighborCounts: neighborsCount?.counts || {},
      __unfetchedNeighborCount: neighborsCount?.totalCount || 0,
      __unfetchedNeighborCounts: neighborsCount?.counts || {},
      __fetchedInEdgeCount: 0,
      __fetchedOutEdgeCount: 0,
      __fetchedUndirectedEdgeCount: 0,
      attributes: parsePropertiesValues(apiVertex["@value"].properties),
    },
  };
};

export default mapApiVertex;
