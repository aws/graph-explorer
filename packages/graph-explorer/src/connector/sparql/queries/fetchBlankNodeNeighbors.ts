import groupBy from "lodash/groupBy";
import { ErrorResponse } from "../../AbstractConnector";
import isErrorResponse from "../../utils/isErrorResponse";
import mapIncomingToEdge, {
  IncomingPredicate,
  isIncomingPredicate,
} from "../mappers/mapIncomingToEdge";
import mapOutgoingToEdge, {
  OutgoingPredicate,
} from "../mappers/mapOutgoingToEdge";
import mapRawResultToVertex from "../mappers/mapRawResultToVertex";
import blankNodeOneHopNeighborsTemplate from "../templates/oneHopNeighbors/blankNodeOneHopNeighborsTemplate";
import blankNodeSubjectPredicatesTemplate from "../templates/subjectPredicates/blankNodeSubjectPredicatesTemplate";
import {
  RawResult,
  RawValue,
  SPARQLBlankNodeNeighborsRequest,
  SPARQLBlankNodeNeighborsResponse,
  SparqlFetch,
} from "../types";

type RawBlankNodeNeighborsResponse = {
  results: {
    bindings: Array<{
      bNode: RawValue;
      subject: RawValue;
      pred: RawValue;
      value: RawValue;
      subjectClass: RawValue;
      pToSubject?: RawValue;
      pFromSubject?: RawValue;
    }>;
  };
};

type RawNeighborsPredicatesResponse = {
  results: {
    bindings: Array<OutgoingPredicate | IncomingPredicate>;
  };
};

const fetchBlankNodeNeighborsPredicates = async (
  sparqlFetch: SparqlFetch,
  subQuery: string,
  resourceURI: string,
  resourceClass: string,
  subjectURIs: string[]
) => {
  const template = blankNodeSubjectPredicatesTemplate({
    subQuery,
    subjectURIs,
  });

  const response = await sparqlFetch<RawNeighborsPredicatesResponse>(template);
  return response.results.bindings.map(result => {
    if (isIncomingPredicate(result)) {
      return mapIncomingToEdge(resourceURI, resourceClass, result);
    }

    return mapOutgoingToEdge(resourceURI, resourceClass, result);
  });
};

export const mapOneHop = (data: RawBlankNodeNeighborsResponse) => {
  const groupBySubject = groupBy(
    data.results.bindings,
    result => result.subject.value
  );

  const mappedResults: Record<string, RawResult> = {};

  Object.entries(groupBySubject).forEach(([uri, result]) => {
    mappedResults[uri] = {
      uri: uri,
      class: result[0].subjectClass.value,
      isBlank: result[0].subject.type === "bnode",
      attributes: {},
    };

    result.forEach(attr => {
      mappedResults[uri].attributes[attr.pred.value] = attr.value.value;
    });
  });

  return Object.values(mappedResults).map(result => {
    return mapRawResultToVertex(result);
  });
};

const fetchBlankNodeNeighbors = async (
  sparqlFetch: SparqlFetch,
  req: SPARQLBlankNodeNeighborsRequest
): Promise<SPARQLBlankNodeNeighborsResponse> => {
  const neighborsTemplate = blankNodeOneHopNeighborsTemplate(req.subQuery);
  const neighbors = await sparqlFetch<
    RawBlankNodeNeighborsResponse | ErrorResponse
  >(neighborsTemplate);

  if (isErrorResponse(neighbors)) {
    throw new Error(neighbors.detailedMessage);
  }

  const filteredNeighbors = neighbors.results.bindings.filter(
    result => result.bNode.value === req.resourceURI
  );

  const vertices = mapOneHop({
    results: {
      bindings: filteredNeighbors,
    },
  });
  const subjectsURIs = vertices.map(v => v.data.id);
  const edges = await fetchBlankNodeNeighborsPredicates(
    sparqlFetch,
    req.subQuery,
    req.resourceURI,
    req.resourceClass,
    subjectsURIs
  );

  return {
    totalCount: vertices.length,
    counts: Object.entries(groupBy(vertices, v => v.data.type)).reduce(
      (counts, [group, vs]) => {
        counts[group] = vs.length;
        return counts;
      },
      {} as Record<string, number>
    ),
    neighbors: {
      vertices,
      edges,
    },
  };
};

export default fetchBlankNodeNeighbors;
