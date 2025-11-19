import { logger, query } from "@/utils";
import type { RawQueryRequest, RawQueryResponse } from "../useGEFetchTypes";
import type { OpenCypherFetch } from "./types";
import isErrorResponse from "../utils/isErrorResponse";
import { mapResults } from "./mappers/mapResults";

export async function rawQuery(
  openCypherFetch: OpenCypherFetch,
  request: RawQueryRequest,
): Promise<RawQueryResponse> {
  const template = query`${request.query}`;

  if (template.length <= 0) {
    return [];
  }

  // Fetch the results
  const data = await openCypherFetch(template);
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  // Map the results
  return mapResults(data);
}
