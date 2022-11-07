import { ConfigurationContextProps } from "../../../core";
import generatePrefixes from "../../../utils/generatePrefixes";
import {
  ErrorResponse,
  KeywordSearchRequest,
  KeywordSearchResponse,
} from "../../AbstractConnector";
import isErrorResponse from "../../utils/isErrorResponse";
import mapRawResultToVertex from "../mappers/mapRawResultToVertex";
import keywordSearchTemplate from "../templates/keywordSearchTemplate";
import { RawResult, RawValue, SparqlFetch } from "../types";

type RawKeywordResponse = {
  head: {
    vars: ["start", "vertexType", "property", "propertyValue"];
  };
  results: {
    bindings: Array<{
      start: RawValue;
      vertexType: RawValue;
      property: RawValue;
      propertyValue: RawValue;
    }>;
  };
};

const keywordSearch = async (
  config: ConfigurationContextProps,
  sparqlFetch: SparqlFetch,
  req: KeywordSearchRequest
): Promise<KeywordSearchResponse> => {
  const template = keywordSearchTemplate(req);
  const data = await sparqlFetch<RawKeywordResponse | ErrorResponse>(template);

  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  const filteredResults = data.results.bindings.filter(
    result => !req.vertexTypes?.includes(result.start.value)
  );

  const mappedResults: Record<string, RawResult> = {};
  filteredResults.forEach(result => {
    if (!mappedResults[result.start.value]) {
      mappedResults[result.start.value] = {
        __v_id: result.start.value,
        __v_type: result.vertexType.value,
        attributes: {},
      };
    }

    if (result.propertyValue.type === "literal") {
      mappedResults[result.start.value].attributes[result.property.value] =
        result.propertyValue.value;
    }
  });

  const vertices = Object.values(mappedResults).map(result =>
    mapRawResultToVertex(config, result)
  );
  const uris = vertices.map(v => v.data.__v_id);
  const genPrefixes = generatePrefixes(uris, config.schema?.prefixes);

  return {
    vertices: Object.values(mappedResults).map(result =>
      mapRawResultToVertex(config, result)
    ),
    prefixes: genPrefixes,
  };
};

export default keywordSearch;
