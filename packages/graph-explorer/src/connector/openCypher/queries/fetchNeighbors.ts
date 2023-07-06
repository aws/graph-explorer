
import type { NeighborsRequest, NeighborsResponse } from "../../AbstractConnector";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import oneHopTemplate from "../templates/oneHopTemplate";
import type { OCEdge, OCVertex } from "../types";
import { OpenCypherFetch } from "../types";

type RawOneHopRequest = {
    results: [
        {
            vObjects: [OCVertex];
            eObjects: [
                {
                    edge: OCEdge;
                    sourceType: string;
                    targetType: string;
                }
            ];
        },
    ];
};

const fetchNeighbors = async (
openCypherFetch: OpenCypherFetch,
req: NeighborsRequest
): Promise<NeighborsResponse> => {
    const gremlinTemplate = oneHopTemplate(req);
    const data = await openCypherFetch<RawOneHopRequest>(gremlinTemplate);

    const vertices: NeighborsResponse["vertices"] = data.results[0].vObjects.map(
        vertex => mapApiVertex(vertex)
    );

    const edges = data.results[0].eObjects.map(
        edgeInfo => mapApiEdge(edgeInfo.edge, edgeInfo.sourceType[0], edgeInfo.targetType[0])
    );

    return {
        vertices,
        edges,
    };
};

export default fetchNeighbors;
