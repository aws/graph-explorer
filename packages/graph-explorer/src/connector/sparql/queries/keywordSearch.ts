import { ErrorResponse, KeywordSearchResponse } from "../../AbstractConnector";
import isErrorResponse from "../../utils/isErrorResponse";
import mapRawResultToVertex from "../mappers/mapRawResultToVertex";
import keywordSearchTemplate from "../templates/keywordSearch/keywordSearchTemplate";
import {
  RawResult,
  RawValue,
  SparqlFetch,
  SPARQLKeywordSearchRequest,
} from "../types";

type RawKeywordResponse = {
  head: {
    vars: ["subject", "class", "pred", "value"];
  };
  results: {
    bindings: Array<{
      subject: RawValue;
      class: RawValue;
      pred: RawValue;
      value: RawValue;
    }>;
  };
};

const keywordSearch = async (
  sparqlFetch: SparqlFetch,
  req: SPARQLKeywordSearchRequest
): Promise<KeywordSearchResponse> => {
  const template = keywordSearchTemplate(req);
  const data = await sparqlFetch<RawKeywordResponse | ErrorResponse>(template);

  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  const filteredResults = data.results.bindings.filter(
    result => !req.subjectClasses?.includes(result.subject.value)
  );

  const mappedResults: Record<string, RawResult> = {};
  filteredResults.forEach(result => {
    if (!mappedResults[result.subject.value]) {
      mappedResults[result.subject.value] = {
        isBlank: result.subject.type === "bnode",
        uri: result.subject.value,
        class: result.class.value,
        attributes: {},
      };
    }

    if (result.value.type === "literal") {
      mappedResults[result.subject.value].attributes[result.pred.value] =
        result.value.value;
    }
  });

  const vertices = Object.values(mappedResults).map(result => {
    return mapRawResultToVertex(result);
  });

  return {
    vertices,
  };
};

export default keywordSearch;
