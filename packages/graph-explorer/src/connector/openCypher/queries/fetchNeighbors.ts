import type {
  NeighborsRequest,
  NeighborsResponse,
} from "@/connector/useGEFetchTypes";
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
        },
      ];
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

  const edges = oneHopData.results[0].eObjects.map(edgeInfo =>
    mapApiEdge(edgeInfo.edge, edgeInfo.sourceType[0], edgeInfo.targetType[0])
  );

  const vertices: NeighborsResponse["vertices"] =
    oneHopData.results[0].vObjects.map(vertex => mapApiVertex(vertex));

  return {
    vertices,
    edges,
    scalars: [],
  };
};

export default fetchNeighbors;
