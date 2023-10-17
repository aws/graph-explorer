import { 
    SubGraphRequest,
    SubGraphResponse
} from "../../AbstractConnector";
import toStringId from "../mappers/toStringId";
import subgraphTemplate from "../templates/subgraphTemplate";
import subedgeTemplate from "../templates/subedgeTemplate";
import mapApiVertex from "../mappers/mapApiVertex";
import mapApiEdge from "../mappers/mapApiEdge";
import type { GVertexList, GEdgeList } from "../types";
import { GInt64, GremlinFetch } from "../types";
import { Edge, Vertex } from "../../../@types/entities";

type RawSubGraphRequest = {
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
    }
  };
};

const idType = (id: string | GInt64) => {
    if (typeof id === "string") {
      return "string";
    }
  
    return "number";
};

const subgraphResult = async (
    gremlinFetch: GremlinFetch,
    req: SubGraphRequest,
    rawIds: Map<string, "string" | "number">
): Promise<SubGraphResponse> => {

    
    const vSG = subgraphTemplate({...req});
    const eSG = subedgeTemplate({...req});
    let [vData, eData] = await Promise.all([
        gremlinFetch<RawSubGraphRequest>(vSG),
        gremlinFetch<RawSubGraphRequest>(eSG)
    ]);
    console.log(vData.result.data["@value"])
    console.log(eData.result.data["@value"])

    const verticesResponse =
      vData.result.data["@value"];
    const edgesResponse = 
      eData.result.data["@value"];
    //const verticesIds = verticesResponse?.map(v => toStringId(v["@value"].id));
    const vertices: SubGraphResponse["vertices"]  =  []/*verticesResponse?.map(
      vertex => mapApiVertex(vertex)
    );*/
    const edges: SubGraphResponse["edges"] = []
    /*const edges = eData.result.data["@value"]?.[0]?.["@value"][3]["@value"]
      .map(value => {
        return mapApiEdge(value);
      })
      .filter(
        edge =>
          verticesIds.includes(edge.data.source) ||
          verticesIds.includes(edge.data.target)
      );*/
    console.log(`Vertices: ${vertices}`);
    console.log(`Edges: ${edges}`);

    return { vertices, edges };
};

export default subgraphResult;