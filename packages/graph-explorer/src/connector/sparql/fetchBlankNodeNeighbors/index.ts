import groupBy from "lodash/groupBy";
import type { ErrorResponse } from "@/connector/useGEFetchTypes";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapIncomingToEdge, {
  IncomingPredicate,
  isIncomingPredicate,
} from "../mappers/mapIncomingToEdge";
import mapOutgoingToEdge, {
  OutgoingPredicate,
} from "../mappers/mapOutgoingToEdge";
import mapRawResultToVertex from "../mappers/mapRawResultToVertex";
import blankNodeOneHopNeighborsTemplate from "./blankNodeOneHopNeighborsTemplate";
import blankNodeSubjectPredicatesTemplate from "./blankNodeSubjectPredicatesTemplate";
import {
  RawResult,
  RawValue,
  SPARQLBlankNodeNeighborsRequest,
  SPARQLBlankNodeNeighborsResponse,
  SparqlFetch,
} from "../types";
import { logger } from "@/utils";
import { Vertex, VertexId } from "@/core";
import { mapAttributeValue } from "../mappers/mapAttributeValue";

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

async function fetchBlankNodeNeighborsPredicates(
  sparqlFetch: SparqlFetch,
  subQuery: string,
  resourceURI: VertexId,
  resourceClasses: Vertex["types"],
  subjectURIs: VertexId[]
) {
  const template = blankNodeSubjectPredicatesTemplate({
    subQuery,
    subjectURIs,
  });

  logger.log("[SPARQL Explorer] Fetching blank node neighbor predicates...", {
    subQuery,
    resourceURI,
    resourceClasses,
    subjectURIs,
  });
  const response = await sparqlFetch<RawNeighborsPredicatesResponse>(template);
  return response.results.bindings.map(result => {
    if (isIncomingPredicate(result)) {
      return mapIncomingToEdge(resourceURI, resourceClasses, result);
    }

    return mapOutgoingToEdge(resourceURI, resourceClasses, result);
  });
}

export function mapOneHop(data: RawBlankNodeNeighborsResponse) {
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
      mappedResults[uri].attributes[attr.pred.value] = mapAttributeValue(
        attr.value
      );
    });
  });

  return Object.values(mappedResults).map(result => {
    return mapRawResultToVertex(result);
  });
}

export default async function fetchBlankNodeNeighbors(
  sparqlFetch: SparqlFetch,
  req: SPARQLBlankNodeNeighborsRequest
): Promise<SPARQLBlankNodeNeighborsResponse> {
  logger.log("[SPARQL Explorer] Fetching blank node one hop neighbors", req);
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
  const subjectsURIs = vertices.map(v => v.id);
  const edges = await fetchBlankNodeNeighborsPredicates(
    sparqlFetch,
    req.subQuery,
    req.resourceURI,
    req.resourceClasses,
    subjectsURIs
  );

  return {
    vertexId: req.resourceURI,
    totalCount: vertices.length,
    counts: Object.entries(groupBy(vertices, v => v.type)).reduce(
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
}
