
import type { NeighborsRequest, NeighborsResponse } from "../../AbstractConnector";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import oneHopTemplate from "../templates/oneHopTemplate";
import oneHopTemplateEdges from "../templates/oneHopTemplateEdges";
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

type NeighborsRequestEdge = NeighborsRequest & {edgeIds: string[]};

const fetchNeighbors = async (
openCypherFetch: OpenCypherFetch,
req: NeighborsRequest
): Promise<NeighborsResponse> => {
    const openCypherTemplate = oneHopTemplate(req);
    const oneHopData = await openCypherFetch<RawOneHopRequest>(openCypherTemplate);
    
    const edges = oneHopData.results[0].eObjects.map(
        edgeInfo => mapApiEdge(edgeInfo.edge, edgeInfo.sourceType[0], edgeInfo.targetType[0])
    );

    const edgeReq: NeighborsRequestEdge = {
        ...req,
        edgeIds: [...oneHopData.results[0].eObjects.map(edgeInfo => edgeInfo.edge["~id"])],
    };

    const openCypherTemplateEdges = oneHopTemplateEdges(edgeReq);
    const oneHopEdgeData = await openCypherFetch<RawOneHopRequest>(openCypherTemplateEdges);

    const vertices: NeighborsResponse["vertices"] = oneHopEdgeData.results[0].vObjects.map(
        vertex => mapApiVertex(vertex)
    );

    return {
        vertices,
        edges,
    };
};

export default fetchNeighbors;
