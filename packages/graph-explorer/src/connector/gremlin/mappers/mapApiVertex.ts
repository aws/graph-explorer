import type { Vertex, VertexId } from "@/@types/entities";
import type { NeighborsCountResponse } from "@/connector/useGEFetchTypes";
import type { GVertex } from "../types";
import { detectIdType } from "./detectIdType";
import parsePropertiesValues from "./parsePropertiesValues";
import toStringId from "./toStringId";

const mapApiVertex = (
  apiVertex: GVertex,
  neighborsCount: NeighborsCountResponse = { totalCount: 0, counts: {} }
): Vertex => {
  const labels = apiVertex["@value"].label.split("::");
  const vt = labels[0];
  const isFragment = apiVertex["@value"].properties == null;

  return {
    entityType: "vertex",
    id: toStringId(apiVertex["@value"].id) as VertexId,
    idType: detectIdType(apiVertex["@value"].id),
    type: vt,
    types: labels,
    neighborsCount: neighborsCount?.totalCount || 0,
    neighborsCountByType: neighborsCount?.counts || {},
    attributes: parsePropertiesValues(apiVertex["@value"].properties ?? {}),
    __isFragment: isFragment,
  };
};

export default mapApiVertex;
