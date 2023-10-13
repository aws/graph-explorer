import { 
    SubGraphRequest,
    SubGraphResponse
} from "../../AbstractConnector";
import toStringId from "../mappers/toStringId";
import subgraphTemplate from "../templates/subgraphTemplate";
import mapApiVertex from "../mappers/mapApiVertex";
import mapApiEdge from "../mappers/mapApiEdge";
import type { GVertexList, GEdgeList } from "../types";
import { GInt64, GremlinFetch } from "../types";

type RawSubGraphRequest = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: GVertexList;
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
): Promise<any> => {
    const date  = req.date ?? Date.now().toLocaleString();
    const canvas = req.canvas;
    const directions = subgraphTemplate({...req})
    let [vData] = await Promise.all([
        gremlinFetch<RawSubGraphRequest>(directions)
        //gremlinFetch<RawSubGraphResponse>(directions[1]),
    ]);
    console.log(vData);
    //const edgesResponse = 
    //  eData.result.data["@value"]?.[0]?.["@value"][1]["@value"];

    const verticesResponse = vData.result.data["@value"].map(value => {
      rawIds.set(toStringId(value["@value"].id), idType(value["@value"].id));
      return mapApiVertex(value);
    });
    const vertices: SubGraphResponse["vertices"] = verticesResponse;
    const edges: SubGraphResponse["edges"] = [];

    return { vertices, edges };
};

export default subgraphResult;