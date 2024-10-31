import { Vertex, VertexId } from "@/@types/entities";
import type { NeighborsCountResponse } from "@/connector/useGEFetchTypes";
import { RawResult } from "../types";

const mapRawResultToVertex = (
  rawResult: RawResult,
  neighborsCount?: NeighborsCountResponse
): Vertex => {
  return {
    id: rawResult.uri as VertexId,
    idType: "string",
    type: rawResult.class,
    neighborsCount: neighborsCount?.totalCount || 0,
    neighborsCountByType: neighborsCount?.counts || {},
    attributes: rawResult.attributes,
    __isBlank: rawResult.isBlank,
  };
};

export default mapRawResultToVertex;
