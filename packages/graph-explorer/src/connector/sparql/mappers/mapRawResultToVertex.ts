import { Vertex } from "../../../@types/entities";
import { NeighborsCountResponse } from "../../AbstractConnector";
import { RawResult } from "../types";

const mapRawResultToVertex = (
  rawResult: RawResult,
  neighborsCount?: NeighborsCountResponse
): Vertex => {
  return {
    data: {
      id: rawResult.uri,
      type: rawResult.class,
      neighborsCount: neighborsCount?.totalCount || 0,
      neighborsCountByType: neighborsCount?.counts || {},
      attributes: rawResult.attributes,
      __isBlank: rawResult.isBlank,
    },
  };
};

export default mapRawResultToVertex;
