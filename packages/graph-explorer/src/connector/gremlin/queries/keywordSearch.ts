import type {
  ErrorResponse,
  KeywordSearchRequest,
  KeywordSearchResponse,
} from "../../AbstractConnector";
import isErrorResponse from "../../utils/isErrorResponse";
import mapApiVertex from "../mappers/mapApiVertex";
import toStringId from "../mappers/toStringId";
import keywordSearchTemplate from "../templates/keywordSearchTemplate";
import type { GVertexList } from "../types";
import { GInt64, GremlinFetch } from "../types";

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

const idType = (id: string | GInt64) => {
  if (typeof id === "string") {
    return "string";
  }

  return "number";
};

const keywordSearch = async (
  gremlinFetch: GremlinFetch,
  req: KeywordSearchRequest,
  rawIds: Map<string, "string" | "number">
): Promise<KeywordSearchResponse> => {
  const gremlinTemplate = keywordSearchTemplate(req);
  const data = await gremlinFetch<RawKeySearchResponse | ErrorResponse>(
    gremlinTemplate
  );

  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  const vertices = data.result.data["@value"].map(value => {
    rawIds.set(toStringId(value["@value"].id), idType(value["@value"].id));
    return mapApiVertex(value);
  });

  return { vertices };
};

export default keywordSearch;
