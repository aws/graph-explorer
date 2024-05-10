import type {
  NeighborsCountRequest,
  NeighborsCountResponse,
} from "../../useGEFetchTypes";
import neighborsCountTemplate from "../templates/neighborsCountTemplate";
import type { GInt64 } from "../types";
import { GremlinFetch } from "../types";

type RawNeighborsCountResponse = {
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
        "@value": (string | GInt64)[];
      }>;
    };
  };
};

const fetchNeighborsCount = async (
  gremlinFetch: GremlinFetch,
  req: NeighborsCountRequest
): Promise<NeighborsCountResponse> => {
  const gremlinTemplate = neighborsCountTemplate(req);
  const data = await gremlinFetch<RawNeighborsCountResponse>(gremlinTemplate);

  const pairs = data.result.data["@value"]?.[0]?.["@value"] || [];
  let totalCount = 0;
  const counts: Record<string, number> = {};
  for (let i = 0; i < pairs.length; i += 2) {
    const vertexType = pairs[i] as string;
    const count = (pairs[i + 1] as GInt64)["@value"];

    totalCount += count;
    counts[vertexType] = count;
  }

  return {
    totalCount,
    counts,
  };
};

export default fetchNeighborsCount;
