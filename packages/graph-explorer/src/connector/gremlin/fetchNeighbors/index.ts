import {
  type NeighborsRequest,
  type NeighborsResponse,
} from "@/connector/useGEFetchTypes";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import oneHopTemplate from "./oneHopTemplate";
import type { GEdgeList, GVertex } from "../types";
import { GremlinFetch } from "../types";
import { createEdge, createVertex } from "@/core";

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
    edges: item["@value"][3]["@value"].map(e => mapApiEdge(e)),
  }));
  const vertices = verticesResponse.map(r => r.vertex).map(createVertex);
  const edges = verticesResponse.flatMap(r => r.edges).map(createEdge);

  return {
    vertices,
    edges,
  };
};

export default fetchNeighbors;
