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
    let vertices: SubGraphResponse["vertices"] = []
    let edges: SubGraphResponse["edges"] = []

    if (req.canV.length <= 0 && req.canE.length <=0){
      return { vertices, edges}
    }

    // Create the Vertices Result
    const vSG = subgraphTemplate({...req});
    const eSG = subedgeTemplate({...req})
    let [vData] = await Promise.all([gremlinFetch<RawSubVertRequest>(vSG)]);
    const verticesResponse =
      vData.result.data["@value"]
    const verticesIds = verticesResponse.map(v => toStringId(v["@value"]["id"]))
    vertices = verticesResponse?.map(
      vertex => mapApiVertex(vertex)
    );

    //Create the Edges result
    console.log("Edges Found:")
    console.log(req.canE.length)
    if (req.canE.length <= 0){
      console.log("No edges")
      edges = []
    } else {
      let [eData] = await Promise.all([gremlinFetch<RawSubEdgeRequest>(eSG)])
      const edgesResponse = 
        eData.result.data["@value"];
      console.log("CONFIRMATION");
      console.log(edgesResponse);
      edges = edgesResponse?.map(
        edge => mapApiEdge(edge)
      )
      .filter(
        edge => 
        verticesIds.includes(edge.data.source) ||
        verticesIds.includes(edge.data.target)
      );
    };

    console.log(`Vertices:`);
    console.log(vertices)
    console.log(`Edges:`);
    console.log(edges)


    return { vertices, edges };
};

export default subgraphResult;