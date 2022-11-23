import groupBy from "lodash/groupBy";
import { Edge } from "../../../@types/entities";
import { NeighborsResponse } from "../../AbstractConnector";
import mapRawResultToVertex from "../mappers/mapRawResultToVertex";
import oneHopNeighborsTemplate from "../templates/oneHopNeighborsTemplate";
import subjectPredicatesTemplate from "../templates/subjectPredicatesTemplate";
import {
  RawResult,
  RawValue,
  SparqlFetch,
  SPARQLNeighborsRequest,
} from "../types";

type RawOneHopNeighborsResponse = {
  results: {
    bindings: Array<{
      subject: RawValue;
      pred: RawValue;
      value: RawValue;
      subjectClass: RawValue;
    }>;
  };
};

type OutgoingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predToSubject: RawValue;
};

type IncomingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predFromSubject: RawValue;
};

type RawNeighborsPredicatesResponse = {
  results: {
    bindings: Array<OutgoingPredicate | IncomingPredicate>;
  };
};

const mapOutgoingToEdge = (
  resourceURI: string,
  resourceClass: string,
  result: OutgoingPredicate
): Edge => {
  return {
    data: {
      id: `${resourceURI}-[${result.predToSubject.value}]->${result.subject.value}`,
      type: result.predToSubject.value,
      source: resourceURI,
      target: result.subject.value,
      sourceType: resourceURI,
      targetType: result.subject.value,
      attributes: {},
    },
  };
};

const mapIncomingToEdge = (
  resourceURI: string,
  resourceClass: string,
  result: IncomingPredicate
): Edge => {
  return {
    data: {
      id: `${result.subject.value}-[${result.predFromSubject.value}]->${resourceURI}`,
      type: result.predFromSubject.value,
      source: result.subject.value,
      target: resourceURI,
      sourceType: result.subjectClass.value,
      targetType: resourceClass,
      attributes: {},
    },
  };
};

const fetchOneHopNeighbors = async (
  sparqlFetch: SparqlFetch,
  req: SPARQLNeighborsRequest
) => {
  const oneHopTemplate = oneHopNeighborsTemplate(req);
  const data = await sparqlFetch<RawOneHopNeighborsResponse>(oneHopTemplate);

  const groupBySubject = groupBy(
    data.results.bindings,
    result => result.subject.value
  );

  const mappedResults: Record<string, RawResult> = {};

  Object.entries(groupBySubject).forEach(([uri, result]) => {
    mappedResults[uri] = {
      uri: uri,
      class: result[0].subjectClass.value,
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

const isIncomingPredicate = (result: any): result is IncomingPredicate => {
  return !!result.predFromSubject;
};

const fetchNeighborsPredicates = async (
  sparqlFetch: SparqlFetch,
  resourceURI: string,
  resourceClass: string,
  subjectURIs: string[]
) => {
  const template = subjectPredicatesTemplate({
    resourceURI,
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

/**
 * Given a subject URI, it returns a set of subjects (with their properties)
 * which are directly connected.
 * We differentiate two types of neighbors:
 * - outgoing neighbors, which are neighbors that are reached using
 *   the given subject as starting point (<subject_uri> ?pred ?outgoingSubject)
 * - incoming neighbors, which are neighbors can reach the given
 *   subject (?incomingSubject ?pred <subject_uri>)
 *
 * It also, perform a query for each neighbors to know
 * how many subjects are connected to it.
 *
 * It does not return neighbors counts.
 */
const fetchNeighbors = async (
  sparqlFetch: SparqlFetch,
  req: SPARQLNeighborsRequest
): Promise<NeighborsResponse> => {
  const vertices = await fetchOneHopNeighbors(sparqlFetch, req);
  const subjectsURIs = vertices.map(v => v.data.id);
  const edges = await fetchNeighborsPredicates(
    sparqlFetch,
    req.resourceURI,
    req.resourceClass,
    subjectsURIs
  );

  return {
    vertices,
    edges,
  };
};

export default fetchNeighbors;
