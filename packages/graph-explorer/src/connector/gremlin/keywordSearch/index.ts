import {
  toMappedQueryResults,
  type ErrorResponse,
  type KeywordSearchRequest,
  type KeywordSearchResponse,
} from "@/connector/useGEFetchTypes";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapApiVertex from "../mappers/mapApiVertex";
import keywordSearchTemplate from "./keywordSearchTemplate";
import type { GVertexList } from "../types";
import { GremlinFetch } from "../types";

type RawKeySearchResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: GVertexList;
  };
};

const keywordSearch = async (
  gremlinFetch: GremlinFetch,
  req: KeywordSearchRequest
): Promise<KeywordSearchResponse> => {
  const gremlinTemplate = keywordSearchTemplate(req);
  const data = await gremlinFetch<RawKeySearchResponse | ErrorResponse>(
    gremlinTemplate
  );

  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  const vertices = data.result.data["@value"].map(value => {
    return mapApiVertex(value);
  });

  return toMappedQueryResults({ vertices });
};

export default keywordSearch;
