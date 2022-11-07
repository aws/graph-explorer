import type { ConfigurationContextProps } from "../../../core";
import type {
  NeighborsRequest,
  NeighborsResponse,
} from "../../AbstractConnector";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import oneHopTemplate from "../templates/oneHopTemplate";
import type { GEdgeList, GVertexList } from "../types";
import { GremlinFetch } from "../types";
import fetchNeighborsCount from "./fetchNeighborsCount";

type RawOneHopRequest = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": Array<{
        "@type": "g:Map";
        "@value": ["vertices", GVertexList, "edges", GEdgeList];
      }>;
    };
  };
};

const fetchNeighbors = async (
  gremlinFetch: GremlinFetch,
  req: NeighborsRequest,
  config: ConfigurationContextProps
): Promise<NeighborsResponse> => {
  const gremlinTemplate = oneHopTemplate(req);
  const data = await gremlinFetch<RawOneHopRequest>(gremlinTemplate);

  const vertices = await Promise.all(
    data.result.data["@value"]?.[0]?.["@value"][1]["@value"].map(
      async value => {
        const neighborsCount = await fetchNeighborsCount(gremlinFetch, {
          vertexId: value["@value"].id,
          limit: 0,
        });
        return mapApiVertex(config, value, neighborsCount);
      }
    )
  );

  const edges = data.result.data["@value"]?.[0]?.["@value"][3]["@value"].map(
    value => {
      return mapApiEdge(config, value);
    }
  );

  return {
    vertices,
    edges,
  };
};

export default fetchNeighbors;
