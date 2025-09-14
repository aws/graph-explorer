import { type RawQueryRequest, type RawQueryResponse } from "../useGEFetchTypes";
import isErrorResponse from "../utils/isErrorResponse";
import { type OpenCypherFetch } from "./types";
import { mapResults } from "./mappers/mapResults";
import { logger, query } from "@/utils";

export async function rawQuery(
  openCypherFetch: OpenCypherFetch,
  request: RawQueryRequest
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
