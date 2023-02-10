import { NeighborsCountResponse } from "../../AbstractConnector";
import neighborsCountTemplate from "../templates/neighborsCount/neighborsCountTemplate";
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

  const incomingTemplate = neighborsCountTemplate(req);
  const incomingData = await sparqlFetch<RawNeighborCount>(incomingTemplate);
  incomingData.results.bindings.forEach(result => {
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
