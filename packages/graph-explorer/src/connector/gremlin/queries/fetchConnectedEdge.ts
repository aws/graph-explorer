import type {
    EdgesResponse,
    EdgesRequest,
    NeighborsRequest,
    NeighborsResponse,
  } from "../../AbstractConnector";
import edgesConnected from "../templates/connectedEdges";
import mapApiEdge from "../mappers/mapApiEdge";
import { GremlinFetch } from "../types";
import type { GEdgeList } from "../types";

type ConnectedEdges = {
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
              "@value": ["edges", GEdgeList];
            }>;
          };
    };
};

const fetchConnectedEdges = async (
    gremlinFetch: GremlinFetch,
    req: EdgesRequest,
    rawIds: Map<string, "string" | "number">
): Promise<EdgesResponse> => {
    const idType = rawIds.get(req.vertexId) ?? "string";
    console.log("test 1")
    //const gremlinTemplate = oneHopTemplate({ ...req, idType });
    //const data = await gremlinFetch<RawOneHopRequest>(gremlinTemplate);
    //const idType = rawIds.get(req.vertexId) ?? "string";
    const gremlinTemplate = edgesConnected({ ...req, idType  });
    //console.log(`Testing: ${gremlinTemplate}`)
    const data = await gremlinFetch<ConnectedEdges>(gremlinTemplate);
    //console.log("test 2")
    //console.log (`Test Return Data ${data}`)
    const unmappedEdges =
        data.result.data["@value"]?.[0]?.["@value"][1]["@value"];
    const edges: EdgesResponse["edges"] = unmappedEdges?.map(
        edge => mapApiEdge(edge)
    );
    return {
        edges,
    }
};

export default fetchConnectedEdges;