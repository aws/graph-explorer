import type {
  CountsByTypeRequest,
  CountsByTypeResponse,
} from "@/connector/useGEFetchTypes";
import vertexTypeCountTemplate from "./vertexTypeCountTemplate";
import { OpenCypherFetch } from "../types";

type RawCountsByTypeResponse = {
  results: [
    {
      count: number;
    },
  ];
};

const fetchVertexTypeCounts = async (
  openCypherFetch: OpenCypherFetch,
  req: CountsByTypeRequest
): Promise<CountsByTypeResponse> => {
  const template = vertexTypeCountTemplate(req.label);
  const response = await openCypherFetch<RawCountsByTypeResponse>(template);
  return {
    total: response.results[0].count,
  };
};

export default fetchVertexTypeCounts;
