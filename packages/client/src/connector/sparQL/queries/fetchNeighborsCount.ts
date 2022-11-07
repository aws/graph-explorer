import {
  NeighborsCountRequest,
  NeighborsCountResponse,
} from "../../AbstractConnector";
import incomingNeighborsCountTemplate from "../templates/incomingNeighborsCountTemplate";
import outgoingNeighborsCountTemplate from "../templates/outgoingNeighborsCountTemplate";
import { SparqlFetch } from "../types";

type RawNeighborCount = {
  head: {
    vars: ["vertexType", "total"];
  };
  results: {
    bindings: Array<{
      vertexType: {
        type: string;
        value: string;
      };
      total: {
        datatype: "http://www.w3.org/2001/XMLSchema#integer";
        type: "literal";
        value: string;
      };
    }>;
  };
};

const fetchNeighborsCount = async (
  sparqlFetch: SparqlFetch,
  req: NeighborsCountRequest
): Promise<NeighborsCountResponse> => {
  let totalCount = 0;
  const counts: Record<string, number> = {};

  const incomingTemplate = incomingNeighborsCountTemplate(req);
  const incomingData = await sparqlFetch<RawNeighborCount>(incomingTemplate);
  incomingData.results.bindings.forEach(result => {
    const count = Number(result.total.value);
    counts[result.vertexType.value] = count;
    totalCount += count;
  });

  const outgoingTemplate = outgoingNeighborsCountTemplate(req);
  const outgoingData = await sparqlFetch<RawNeighborCount>(outgoingTemplate);
  outgoingData.results.bindings.forEach(result => {
    const count = Number(result.total.value);
    counts[result.vertexType.value] = count;
    totalCount += count;
  });

  return {
    totalCount,
    counts,
  };
};

export default fetchNeighborsCount;
