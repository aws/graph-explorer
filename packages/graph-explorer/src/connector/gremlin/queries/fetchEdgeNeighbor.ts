import type {
    NeighborsRequest,
    NeighborsResponse,
} from "../../AbstractConnector";
  import mapApiEdge from "../mappers/mapApiEdge";
  import mapApiVertex from "../mappers/mapApiVertex";
  import toStringId from "../mappers/toStringId";
  //import oneHopTemplate from "../templates/oneHopTemplate";
  import edgeOneHopTemplate from "../templates/edgeOneHopTemplate";
  import expandEdgeDetails from "../templates/expandEdgeDetails";
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
    //const gremlinTemplate = edgeOneHopTemplate({ ...req, idType });
    console.log(`Demo: ${edgeOneHopTemplate({...req, idType})}`);
    //cont edgeTemplate = expandEdgeDetails({...req, idType})
    const gremlinTemplate = `g.V("64c47f3a-af4b-4b52-0698-1d8c0dbb5263").project("vertices", "edges").by(bothE("j2").and(has("J2_Record_Expiration_Date__c",gte("2023-09-06")), has("J2_Record_Active_Date__c",lte("2023-09-06"))).dedup().outV().range(0,500).fold())`
    const edgeTemplate = `g.V("64c47f3a-af4b-4b52-0698-1d8c0dbb5263").project("vertices", "edges").by(bothE("j2").and(has("J2_Record_Expiration_Date__c",gte("2023-09-06")), has("J2_Record_Active_Date__c",lte("2023-09-06"))).dedup().range(0,500).fold())`
    //const gremlinTemplate = `g.V("64c47f3a-af4b-4b52-0698-1d8c0dbb5263").project("vertices", "edges").by(bothE("j2").and(has("J2_Record_Expiration_Date__c","4000-12-31")).dedup().outV().range(0,500).fold())
    //const edgeTemplate = `g.V("64c47f3a-af4b-4b52-0698-1d8c0dbb5263").project("vertices", "edges").by(bothE("j2").and(has("J2_Record_Expiration_Date__c","4000-12-31")).dedup().range(0,500).fold())`
    console.log(`Query: ${gremlinTemplate}`)
    
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