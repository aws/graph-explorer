import {
  toMappedQueryResults,
  type NeighborsRequest,
  type NeighborsResponse,
} from "@/connector/useGEFetchTypes";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import oneHopTemplate from "./oneHopTemplate";
import type { OCEdge, OCVertex } from "../types";
import { OpenCypherFetch } from "../types";

type RawOneHopRequest = {
  results: [
    {
      vObjects: [OCVertex];
      eObjects: [OCEdge];
    },
  ];
};

const fetchNeighbors = async (
  openCypherFetch: OpenCypherFetch,
  req: NeighborsRequest
): Promise<NeighborsResponse> => {
  const openCypherTemplate = oneHopTemplate(req);
  const oneHopData =
    await openCypherFetch<RawOneHopRequest>(openCypherTemplate);

  const edges = oneHopData.results[0].eObjects.map(mapApiEdge);

  const vertices: NeighborsResponse["vertices"] =
    oneHopData.results[0].vObjects.map(mapApiVertex);

  return toMappedQueryResults({
    vertices,
    edges,
  });
};

export default fetchNeighbors;
