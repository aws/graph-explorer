import { 
    SubGraphRequest,
    SubGraphResponse
} from "../../AbstractConnector";
import toStringId from "../mappers/toStringId";
import subgraphTemplate from "../templates/subgraphTemplate";
import mapApiVertex from "../mappers/mapApiVertex";
import type { GVertexList, GEdgeList } from "../types";
import { GInt64, GremlinFetch } from "../types";

type RawSubGraphResponse = {
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
): Promise<SubGraphResponse> => {
    const date  = req.date ?? Date.now().toLocaleString();
    const directions = subgraphTemplate({...req, date})
    console.log(directions)
    let [createRes, subRes, testRes] = await Promise.all([
        gremlinFetch<RawSubGraphResponse>(directions[0]),
        gremlinFetch<RawSubGraphResponse>(directions[1]),
        gremlinFetch<RawSubGraphResponse>(directions[2])
    ]);
    console.log(createRes);
    console.log(subRes);
    console.log(testRes);

    const data = testRes;

    const vertices = data.result.data["@value"].map(value => {
        rawIds.set(toStringId(value["@value"].id), idType(value["@value"].id));
        return mapApiVertex(value);
    });

    console.log(vertices)

    return { vertices };
};

export default subgraphResult;