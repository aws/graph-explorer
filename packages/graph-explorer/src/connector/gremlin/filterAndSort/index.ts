import type {
  ErrorResponse,
  FilterAndSortRequest,
  FilterAndSortResponse,
} from "@/connector/useGEFetchTypes";

import isErrorResponse from "@/connector/utils/isErrorResponse";
import { createVertex } from "@/core";

import type { GVertexList } from "../types";
import type { GremlinFetch } from "../types";

import mapApiVertex from "../mappers/mapApiVertex";
import filterAndSortTemplate from "./filterAndSortTemplate";

type RawFilterAndSortResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: GVertexList;
  };
};

async function filterAndSortSearch(
  gremlinFetch: GremlinFetch,
  req: FilterAndSortRequest,
): Promise<FilterAndSortResponse> {
  const gremlinTemplate = filterAndSortTemplate(req);
  const data = await gremlinFetch<RawFilterAndSortResponse | ErrorResponse>(
    gremlinTemplate,
  );

  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  const vertices = data.result.data["@value"]
    .map(value => mapApiVertex(value))
    .map(createVertex);

  return { vertices };
}

export default filterAndSortSearch;
