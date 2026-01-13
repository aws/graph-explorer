import type {
  ErrorResponse,
  KeywordSearchRequest,
  KeywordSearchResponse,
} from "@/connector/useGEFetchTypes";

import isErrorResponse from "@/connector/utils/isErrorResponse";
import { createVertex } from "@/core";

import type { GVertexList } from "../types";
import type { GremlinFetch } from "../types";

import mapApiVertex from "../mappers/mapApiVertex";
import keywordSearchTemplate from "./keywordSearchTemplate";

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
  req: KeywordSearchRequest,
): Promise<KeywordSearchResponse> => {
  const gremlinTemplate = keywordSearchTemplate(req);
  const data = await gremlinFetch<RawKeySearchResponse | ErrorResponse>(
    gremlinTemplate,
  );

  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  const vertices = data.result.data["@value"]
    .map(value => mapApiVertex(value))
    .map(createVertex);

  return { vertices };
};

export default keywordSearch;
