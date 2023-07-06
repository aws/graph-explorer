import type { Vertex } from "../../../@types/entities";
import type { NeighborsCountResponse } from "../../AbstractConnector";
import type { GVertex } from "../types";
import parsePropertiesValues from "./parsePropertiesValues";
import toStringId from "./toStringId";

const mapApiVertex = (
  apiVertex: GVertex,
  neighborsCount: NeighborsCountResponse = { totalCount: 0, counts: {} }
): Vertex => {
  const labels = apiVertex["@value"].label.split("::");
  const vt = labels[0];

  return {
    data: {
      id: toStringId(apiVertex["@value"].id),
      type: vt,
      types: labels,
      neighborsCount: neighborsCount?.totalCount || 0,
      neighborsCountByType: neighborsCount?.counts || {},
      attributes: parsePropertiesValues(apiVertex["@value"].properties),
    },
  };
};

export default mapApiVertex;
