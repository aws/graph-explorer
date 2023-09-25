import type {
    NeighborsRequest,
    NeighborsResponse,
} from "../../AbstractConnector";
  import mapApiEdge from "../mappers/mapApiEdge";
  import mapApiVertex from "../mappers/mapApiVertex";
  import toStringId from "../mappers/toStringId";
  //import oneHopTemplate from "../templates/oneHopTemplate";
  import edgeVertHopTemplate from "../templates/edgeVertHopTemplate";
  import edgeEdgeHopTemplate from "../templates/edgeEdgeHopTemplate";
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

  const fetchEdgeNeighbors = async (
    gremlinFetch: GremlinFetch,
    req: NeighborsRequest,
    rawIds: Map<string, "string" | "number">
  ): Promise<NeighborsResponse> => {
    const idType = rawIds.get(req.vertexId) ?? "string";
    //const gremlinTemplate = edgeVertHopTemplate({ ...req, idType });
    console.log(`Demo: ${edgeVertHopTemplate({...req, idType})}`);
    const gremlinTemplate = edgeVertHopTemplate({...req, idType}); // Gets the vertices
    const edgeTemplate = edgeEdgeHopTemplate({...req, idType}); // Gets the edges
    console.log(`Query: ${gremlinTemplate}`)
    console.log(`Edge Query ${edgeTemplate}`)

    let [vData, eData] = await Promise.all([
      gremlinFetch<RawOneHopRequest>(gremlinTemplate),
      gremlinFetch<RawOneHopRequest>(edgeTemplate),
    ])
    //const data = await gremlinFetch<RawOneHopRequest>(gremlinTemplate);
    const verticesResponse =
      vData.result.data["@value"]?.[0]?.["@value"][1]["@value"];
    const edgesResponse = 
      eData.result.data["@value"]?.[0]?.["@value"][1]["@value"];
    // So it works with a promise... ok 
    const verticesIds = verticesResponse?.map(v => toStringId(v["@value"].id));
    //const edgeIds = edgesResponse?.map(e => toStringId(e["@value"].id));
    const vertices: NeighborsResponse["vertices"] = verticesResponse?.map(
      vertex => mapApiVertex(vertex)
    );

    const edges = eData.result.data["@value"]?.[0]?.["@value"][3]["@value"]
      .map(value => {
        return mapApiEdge(value);
      })
      .filter(
        edge =>
          verticesIds.includes(edge.data.source) ||
          verticesIds.includes(edge.data.target)
      );
      console.log(`Vertices: ${vertices}`);
      console.log(`Edges: ${edges}`);
    return {
      vertices,
      edges,
    };
  };

  export default fetchEdgeNeighbors;