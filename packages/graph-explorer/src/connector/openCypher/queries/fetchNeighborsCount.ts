import type { NeighborsCountRequest, NeighborsCountResponse } from "../../AbstractConnector";
import neighborsCountTemplate from "../templates/neighborsCountTemplate";
import { OpenCypherFetch } from "../types";

type RawNeighborsCountResponse = {
    results: [
        {
            vertexLabel: string[];
            count: number;
        }
    ];
}

const fetchNeighborsCount = async (
openCypherFetch: OpenCypherFetch,
req: NeighborsCountRequest
): Promise<NeighborsCountResponse> => {
    const openCypherTemplate = neighborsCountTemplate(req);
    const data = await openCypherFetch<RawNeighborsCountResponse>(openCypherTemplate);

    const results = data.results;
    const counts: Record<string, number> = {};
    let totalCount = 0;

    for (let i = 0; i < results.length; i++) {
        totalCount += results[i].count;
        counts[results[i].vertexLabel[0]] = results[i].count;
    }

    return {
        totalCount,
        counts,
    };
};

export default fetchNeighborsCount;
