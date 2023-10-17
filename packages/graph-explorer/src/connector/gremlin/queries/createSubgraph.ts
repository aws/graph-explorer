import { 
    SubGraphRequest,
    SubGraphResponse
} from "../../AbstractConnector";
import toStringId from "../mappers/toStringId";
import subgraphTemplate from "../templates/subgraphTemplate";
import subedgeTemplate from "../templates/subedgeTemplate";
import mapApiVertex from "../mappers/mapApiVertex";
import mapApiEdge from "../mappers/mapApiEdge";
import type { GVertexList, GEdgeList, GVertex, GEdge } from "../types";
import { GInt64, GremlinFetch } from "../types";
import { Edge, Vertex } from "../../../@types/entities";

type RawSubVertRequest = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: GVertexList
  };
};

type RawSubEdgeRequest = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: GEdgeList
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
    let vertices: Vertex[] = []
    let edges: Edge[] = []
    // Edges will not exist without at least 2 nodes
    const vSG = subgraphTemplate({...req});
    const eSG = subgraphTemplate({...req})
    let [vData] = await Promise.all([gremlinFetch<RawSubVertRequest>(vSG)]);
    const verticesResponse =
      vData.result.data["@value"]
    const verticesIds = verticesResponse.map(v => toStringId(v["id"]))
    if (req.canE.length <= 0){
      edges = []
    } else {
      let [eData] = await Promise.all([gremlinFetch<RawSubEdgeRequest>(eSG)])
      const edgesResponse = 
        eData.result.data["@value"]
      console.log(eData.result.data["@value"])
      edges = edgesResponse.map(value =>{
        return mapApiEdge(value)
      })
      .filter(
        edge => 
        verticesIds.includes(edge.data.source) ||
        verticesIds.includes(edge.data.target)
      )
    };
    console.log("VDATA AND EDATA")
    console.log(vData.result.data["@value"])


    //?.[0]["@value"];
    //?.[0]["@value"];
    //const verticesIds = verticesResponse.map(v => toStringId(v["id"]));
    /*const vertices: SubGraphResponse["vertices"]  =  verticesResponse?.map(
      vertex => mapApiVertex(vertex)
    );*/
    //const edges: SubGraphResponse["edges"] = []
    /*const edges = edgesResponse
      .map(value => {
        return mapApiEdge(value);
      })
      /*.filter(
        edge =>
          verticesIds.includes(edge.data.source) ||
          verticesIds.includes(edge.data.target)
      );*/
    console.log(`Vertices: ${vertices}`);
    console.log(`Edges: ${edges}`);

    return { vertices, edges };
};

export default subgraphResult;