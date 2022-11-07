import { Vertex } from "../../../@types/entities";
import { ConfigurationContextProps } from "../../../core";
import { NeighborsCountResponse } from "../../AbstractConnector";
import { RawResult } from "../types";

const mapRawResultToVertex = (
  config: ConfigurationContextProps,
  rawResult: RawResult,
  neighborsCount?: NeighborsCountResponse
): Vertex => {
  const vertexConfig = config.schema?.vertices.find(
    vertex => vertex.type === rawResult.__v_type
  );
  const __v_type_display = vertexConfig?.displayLabel || rawResult.__v_type;

  return {
    data: {
      id: rawResult.__v_id,
      __v_id: rawResult.__v_id,
      __v_type: rawResult.__v_type,
      __v_types: [rawResult.__v_type],
      __v_type_display,
      __isHidden: vertexConfig?.hidden,
      __totalNeighborCount: neighborsCount?.totalCount || 0,
      __totalNeighborCounts: neighborsCount?.counts || {},
      __unfetchedNeighborCount: neighborsCount?.totalCount || 0,
      __unfetchedNeighborCounts: neighborsCount?.counts || {},
      __fetchedInEdgeCount: 0,
      __fetchedOutEdgeCount: 0,
      __fetchedUndirectedEdgeCount: 0,
      attributes: rawResult.attributes,
    },
  };
};

export default mapRawResultToVertex;
