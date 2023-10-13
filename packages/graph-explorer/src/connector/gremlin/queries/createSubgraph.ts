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
    const directions = subgraphTemplate({...req})
    console.log(directions)
    let [createRes] = await Promise.all([
        gremlinFetch<RawSubGraphRequest>(directions[0])
        //gremlinFetch<RawSubGraphResponse>(directions[1]),
    ]);
    console.log(createRes);


    const data = createRes;

    console.log(`Data: ${data}`)

    const vertices = data.result.data["@value"].map(value => {
        rawIds.set(toStringId(value["@value"].id), idType(value["@value"].id));
        return mapApiVertex(value);
    });

    console.log(vertices)

    return { data };
};

export default subgraphResult;