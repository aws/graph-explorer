import { createVertex, Vertex } from "@/core";
import {
  type ErrorResponse,
  type KeywordSearchRequest,
  type KeywordSearchResponse,
} from "@/connector/useGEFetchTypes";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapApiVertex from "../mappers/mapApiVertex";
import keywordSearchTemplate from "./keywordSearchTemplate";
import type { OCVertex } from "../types";
import { OpenCypherFetch } from "../types";

type RawKeySearchResponse = {
  results: [
    {
      object: OCVertex;
    },
  ];
};

const keywordSearch = async (
  openCypherFetch: OpenCypherFetch,
  req: KeywordSearchRequest
): Promise<KeywordSearchResponse> => {
  const vertices = await vertexKeywordSearch(openCypherFetch, req);

  return { vertices };
};

const vertexKeywordSearch = async (
  openCypherFetch: OpenCypherFetch,
  req: KeywordSearchRequest
): Promise<Vertex[]> => {
  const openCypherTemplate = keywordSearchTemplate(req);
  const data = await openCypherFetch<RawKeySearchResponse | ErrorResponse>(
    openCypherTemplate
  );

  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  return data.results
    .map(value => mapApiVertex(value.object))
    .map(createVertex);
};

export default keywordSearch;
