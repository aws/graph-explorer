import {
  CountsByTypeRequest,
  CountsByTypeResponse,
} from "../../AbstractConnector";
import classWithCountsTemplates from "../templates/classWithCountsTemplates";
import { RawValue, SparqlFetch } from "../types";

type RawCountsByTypeResponse = {
  results: {
    bindings: [
      {
        instancesCount: RawValue;
      }
    ];
  };
};

const fetchClassCounts = async (
  sparqlFetch: SparqlFetch,
  req: CountsByTypeRequest
): Promise<CountsByTypeResponse> => {
  const template = classWithCountsTemplates(req.label);
  const response = await sparqlFetch<RawCountsByTypeResponse>(template);

  return {
    total: Number(response.results.bindings[0].instancesCount.value),
  };
};

export default fetchClassCounts;
