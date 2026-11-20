import { logger } from "@/utils";

import type { RawQueryRequest, RawQueryResponse } from "../useGEFetchTypes";
import type { OpenCypherFetch } from "./types";

import isErrorResponse from "../utils/isErrorResponse";
import { mapResults } from "./mappers/mapResults";

export async function rawQuery(
  openCypherFetch: OpenCypherFetch,
  request: RawQueryRequest,
): Promise<RawQueryResponse> {
  if (request.query.length <= 0) {
    return { results: [], rawResponse: null };
  }

  // Fetch the results
  const data = await openCypherFetch(request.query);
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const results = mapResults(data);
  return { results, rawResponse: data };
}
