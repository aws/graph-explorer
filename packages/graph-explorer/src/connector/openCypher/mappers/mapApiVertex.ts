import type { Vertex } from "../../../@types/entities";
import type { NeighborsCountResponse } from "../../AbstractConnector";
import type { OCVertex } from "../types";

const mapApiVertex = (
  apiVertex: OCVertex,
  neighborsCount: NeighborsCountResponse = { totalCount: 0, counts: {} }
): Vertex => {
  const labels = apiVertex["~labels"];
  const vt = labels[0];

  return {
    data: {
      id: apiVertex["~id"],
      type: vt,
      types: labels,
      neighborsCount: neighborsCount?.totalCount || 0,
      neighborsCountByType: neighborsCount?.counts || {},
      attributes: apiVertex["~properties"],
    },
  };
};

export default mapApiVertex;
