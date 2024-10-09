import type { Vertex } from "@/@types/entities";
import type { NeighborsCountResponse } from "@/connector/useGEFetchTypes";
import type { OCVertex } from "../types";

export default function mapApiVertex(
  apiVertex: OCVertex,
  neighborsCount: NeighborsCountResponse = { totalCount: 0, counts: {} }
): Vertex {
  const labels = apiVertex["~labels"];
  const vt = labels[0] ?? "";

  return {
    data: {
      id: apiVertex["~id"],
      idType: "string",
      type: vt,
      types: labels,
      neighborsCount: neighborsCount?.totalCount || 0,
      neighborsCountByType: neighborsCount?.counts || {},
      attributes: apiVertex["~properties"],
    },
  };
}
