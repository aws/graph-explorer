import { 
    SubGraphRequest,
    SubGraphResponse
} from "../../AbstractConnector";
import toStringId from "../mappers/toStringId";
import subgraphTemplate from "../templates/subgraphTemplate";
import mapApiVertex from "../mappers/mapApiVertex";
import type { GVertexList, GEdgeList } from "../types";
import { GInt64, GremlinFetch } from "../types";

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
      };
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
    const directions = subgraphTemplate({...req})
    let [vData] = await Promise.all([
        gremlinFetch<RawSubGraphRequest>(directions)
        //gremlinFetch<RawSubGraphResponse>(directions[1]),
    ]);
    console.log(vData);
    const verticesResponse =
        vData.result.data["@value"]
        //?.[0]?.["@value"][1]["@value"];
    console.log(verticesResponse)
    //const edgesResponse = 
    //  eData.result.data["@value"]?.[0]?.["@value"][1]["@value"];

    /*const vertices: SubGraphResponse["vertices"] = verticesResponse?.map(
        vertex => mapApiVertex(vertex)
    );

    console.log(vertices)*/

    return { vData };
};

export default subgraphResult;