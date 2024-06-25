import type {
  NeighborsRequest,
  NeighborsResponse,
} from "../../useGEFetchTypes";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import oneHopTemplate from "../templates/oneHopTemplate";
import type { GEdgeList, GVertex } from "../types";
import { GremlinFetch } from "../types";

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
        "@value": ["vertex", GVertex, "edges", GEdgeList];
      }>;
    };
  };
};

const fetchNeighbors = async (
  gremlinFetch: GremlinFetch,
  req: NeighborsRequest
): Promise<NeighborsResponse> => {
  const gremlinTemplate = oneHopTemplate(req);
  const data = await gremlinFetch<RawOneHopRequest>(gremlinTemplate);

  const verticesResponse = data.result.data["@value"].map(item => ({
    vertex: mapApiVertex(item["@value"][1]),
    edges: item["@value"][3]["@value"].map(mapApiEdge),
  }));
  const vertices = verticesResponse.map(r => r.vertex);
  const edges = verticesResponse.flatMap(r => r.edges);

  return {
    vertices,
    edges,
  };
};

export default fetchNeighbors;
