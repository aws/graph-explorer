import {
  type NeighborsRequest,
  type NeighborsResponse,
} from "@/connector/useGEFetchTypes";
import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import oneHopTemplate from "./oneHopTemplate";
import type { OCEdge, OCVertex } from "../types";
import { OpenCypherFetch } from "../types";
import { createEdge, createVertex } from "@/core";

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

  // Map directly to `Edge` since these are guaranteed to be fully materialized
  const edges = oneHopData.results[0].eObjects
    .map(e => mapApiEdge(e))
    .map(createEdge);

  // Map directly to `Vertex` since these are guaranteed to be fully materialized
  const vertices = oneHopData.results[0].vObjects
    .map(v => mapApiVertex(v))
    .map(createVertex);

  return {
    vertices,
    edges,
  };
};

export default fetchNeighbors;
