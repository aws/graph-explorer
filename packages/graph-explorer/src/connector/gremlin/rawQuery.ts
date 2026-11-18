import { logger } from "@/utils";

import type {
  ErrorResponse,
  RawQueryRequest,
  RawQueryResponse,
} from "../useGEFetchTypes";
import type { GList, GremlinFetch } from "./types";

import isErrorResponse from "../utils/isErrorResponse";
import { mapResults } from "./mappers/mapResults";

type Response = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: GList;
  };
};

export async function rawQuery(
  gremlinFetch: GremlinFetch,
  request: RawQueryRequest,
): Promise<RawQueryResponse> {
  if (request.query.length <= 0) {
    return { results: [], rawResponse: null };
  }

  // Fetch the results
  const data = await gremlinFetch<Response | ErrorResponse>(request.query);
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const results = mapResults(data.result.data);
  return { results, rawResponse: data };
}
