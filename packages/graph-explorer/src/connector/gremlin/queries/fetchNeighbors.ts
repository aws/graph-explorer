import type {
  NeighborsRequest,
  NeighborsResponse,
} from "../../AbstractConnector";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import toStringId from "../mappers/toStringId";
import oneHopTemplate from "../templates/oneHopTemplate";
import type { GEdgeList, GVertexList } from "../types";
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
        "@value": ["vertices", GVertexList, "edges", GEdgeList];
      }>;
    };
  };
};

const fetchNeighbors = async (
  gremlinFetch: GremlinFetch,
  req: NeighborsRequest,
  rawIds: Map<string, "string" | "number">
): Promise<NeighborsResponse> => {
  const idType = rawIds.get(req.vertexId) ?? "string";
  const gremlinTemplate = oneHopTemplate({ ...req, idType });
  const data = await gremlinFetch<RawOneHopRequest>(gremlinTemplate);

  const verticesResponse =
    data.result.data["@value"]?.[0]?.["@value"][1]["@value"];
  const verticesIds = verticesResponse?.map(v => toStringId(v["@value"].id));
  const vertices: NeighborsResponse["vertices"] = verticesResponse?.map(
    vertex => mapApiVertex(vertex)
  );

  const edges = data.result.data["@value"]?.[0]?.["@value"][3]["@value"]
    .map(value => {
      return mapApiEdge(value);
    })
    .filter(
      edge =>
        verticesIds.includes(edge.data.source) ||
        verticesIds.includes(edge.data.target)
    );

  return {
    vertices,
    edges,
  };
};

export default fetchNeighbors;
