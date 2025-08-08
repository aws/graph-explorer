import { logger, query } from "@/utils";
import {
  ErrorResponse,
  RawQueryRequest,
  RawQueryResponse,
} from "../useGEFetchTypes";
import { GAnyValue, GremlinFetch } from "./types";
import { mapResults } from "./mappers/mapResults";
import isErrorResponse from "../utils/isErrorResponse";

type Response = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: GAnyValue;
  };
};

export async function rawQuery(
  gremlinFetch: GremlinFetch,
  request: RawQueryRequest
): Promise<RawQueryResponse> {
  const template = query`${request.query}`;

  if (template.length <= 0) {
    return [];
  }

  // Fetch the results
  const data = await gremlinFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  // Map the results
  return mapResults(data.result.data);
}
