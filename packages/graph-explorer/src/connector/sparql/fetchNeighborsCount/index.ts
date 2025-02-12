import { logger } from "@/utils";
import type { NeighborsCountResponse } from "@/connector/useGEFetchTypes";
import neighborsCountTemplate from "./neighborsCountTemplate";
import { SparqlFetch, SPARQLNeighborsCountRequest } from "../types";

type RawNeighborCount = {
  head: {
    vars: ["class", "count"];
  };
  results: {
    bindings: Array<{
      class: {
        type: string;
        value: string;
      };
      count: {
        datatype: "http://www.w3.org/2001/XMLSchema#integer";
        type: "literal";
        value: string;
      };
    }>;
  };
};

const fetchNeighborsCount = async (
  sparqlFetch: SparqlFetch,
  req: SPARQLNeighborsCountRequest
): Promise<NeighborsCountResponse> => {
  let totalCount = 0;
  const counts: Record<string, number> = {};

  const template = neighborsCountTemplate(req);
  logger.log("[SPARQL Explorer] Fetching neighbor counts...", req);
  const response = await sparqlFetch<RawNeighborCount>(template);
  response.results.bindings.forEach(result => {
    const count = Number(result.count.value);
    counts[result.class.value] = count;
    totalCount += count;
  });

  return {
    totalCount,
    counts,
  };
};

export default fetchNeighborsCount;
