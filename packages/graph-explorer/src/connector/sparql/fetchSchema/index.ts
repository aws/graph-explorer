import { batchPromisesSerially } from "@/utils";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT } from "@/utils/constants";
import type { SchemaResponse } from "@/connector/useGEFetchTypes";
import classesWithCountsTemplates from "./classesWithCountsTemplates";
import predicatesByClassTemplate from "./predicatesByClassTemplate";
import predicatesWithCountsTemplate from "./predicatesWithCountsTemplate";
import { GraphSummary, RawValue, SparqlFetch } from "../types";
import { LoggerConnector } from "@/connector/LoggerConnector";
import { defaultVertexTypeConfig } from "@/core/StateProvider/configuration";

type RawClassesWCountsResponse = {
  results: {
    bindings: Array<{
      class: RawValue;
      instancesCount: RawValue;
    }>;
  };
};
type RawPredicatesSamplesResponse = {
  results: {
    bindings: Array<{
      pred: RawValue;
      sample: RawValue;
    }>;
  };
};

type RawPredicatesWCountsResponse = {
  results: {
    bindings: Array<{
      predicate: {
        type: string;
        value: string;
      };
      count: {
        datatype: "http://www.w3.org/2001/XMLSchema#integer";
        type: "literal";
        value: string;
      };
    }>;
  };
};

const TYPE_MAP: Record<string, string> = {
  "http://www.w3.org/TR/xmlschema-2/#decimal": "Number",
  "http://www.w3.org/TR/xmlschema-2/#float": "Number",
  "http://www.w3.org/TR/xmlschema-2/#double": "Number",
  "http://www.w3.org/2001/XMLSchema#integer": "Number",
  "http://www.w3.org/TR/xmlschema-2/#duration": "Number",
  "http://www.w3.org/2001/XMLSchema#date": "Date",
  "http://www.w3.org/2001/XMLSchema#dateTime": "Date",
};

const metadataClassBaseUris = [
  "http://www.w3.org/2000/01/rdf-schema",
  "http://www.w3.org/2002/07/owl",
];

const rdfsLabel = "http://www.w3.org/2000/01/rdf-schema#label";
const skosPrefLabel = "http://www.w3.org/2004/02/skos/core#prefLabel";
const skosAltLabel = "http://www.w3.org/2004/02/skos/core#altLabel";
const displayNameCandidates = [rdfsLabel, skosPrefLabel, skosAltLabel];

const rdfsComment = "http://www.w3.org/2000/01/rdf-schema#comment";
const skosNote = "http://www.w3.org/2004/02/skos/core#note";
const skosDefinition = "http://www.w3.org/2004/02/skos/core#definition";
const displayDescCandidates = [rdfsComment, skosNote, skosDefinition];

const fetchPredicatesByClass = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector,
  classes: Array<string>,
  countsByClass: Record<string, number>
) => {
  const responses = await batchPromisesSerially(
    classes,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async resourceClass => {
      const classPredicatesTemplate = predicatesByClassTemplate({
        class: resourceClass,
      });
      remoteLogger.info(
        `[SPARQL Explorer] Fetching predicates by class ${resourceClass}...`
      );
      const predicatesResponse =
        await sparqlFetch<RawPredicatesSamplesResponse>(
          classPredicatesTemplate
        );

      const attributes = new Map(
        predicatesResponse.results.bindings
          .map(item => ({
            name: item.pred.value,
            searchable: true,
            hidden: false,
            dataType: TYPE_MAP[item.sample.datatype || ""] || "String",
          }))
          .map(a => [a.name, a])
      );

      return {
        attributes,
        resourceClass,
      };
    }
  );

  return responses.map(({ attributes, resourceClass }) => ({
    type: resourceClass,
    total: countsByClass[resourceClass],
    displayNameAttribute:
      displayNameCandidates
        .values()
        .map(c => attributes.get(c)?.name)
        .filter(n => n != null)
        .next().value ?? defaultVertexTypeConfig.displayNameAttribute,
    longDisplayNameAttribute:
      displayDescCandidates
        .values()
        .map(c => attributes.get(c)?.name)
        .filter(n => n != null)
        .next().value ?? defaultVertexTypeConfig.longDisplayNameAttribute,
    attributes: attributes.values().toArray(),
  }));
};

const fetchClassesSchema = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector
) => {
  const classesTemplate = classesWithCountsTemplates();
  remoteLogger.info("[SPARQL Explorer] Fetching classes schema...");
  const classesCounts =
    await sparqlFetch<RawClassesWCountsResponse>(classesTemplate);

  const classes: Array<string> = [];
  const countsByClass: Record<string, number> = {};
  classesCounts.results.bindings
    // Exclude classes that start with one of the metadata class base URIs
    .filter(
      c => !metadataClassBaseUris.some(uri => c.class.value.startsWith(uri))
    )
    .forEach(classResult => {
      classes.push(classResult.class.value);
      countsByClass[classResult.class.value] = Number(
        classResult.instancesCount.value
      );
    });

  return fetchPredicatesByClass(
    sparqlFetch,
    remoteLogger,
    classes,
    countsByClass
  );
};

const fetchPredicatesWithCounts = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector
): Promise<Record<string, number>> => {
  const template = predicatesWithCountsTemplate();
  remoteLogger.info("[SPARQL Explorer] Fetching predicates with counts...");
  const data = await sparqlFetch<RawPredicatesWCountsResponse>(template);

  const values = data.results.bindings;
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 1) {
    labelsWithCounts[values[i].predicate.value] = Number(values[i].count.value);
  }

  return labelsWithCounts;
};

const fetchPredicatesSchema = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector
) => {
  const allLabels = await fetchPredicatesWithCounts(sparqlFetch, remoteLogger);

  return Object.entries(allLabels).map(([label, count]) => {
    return {
      type: label,
      total: count,
      attributes: [],
    };
  });
};

/**
 * Fetch the database shape.
 * It follows this process:
 * 1. Fetch all distinct classes their counts
 * 2. For each class,
 *    - fetch all predicates to literals
 *    - and map those predicates to know the shape of the class
 * 3. Fetch all predicates to non-literals and their counts
 * 4. Generate prefixes using the received URIs
 */
const fetchSchema = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector,
  summary?: GraphSummary
): Promise<SchemaResponse> => {
  if (!summary) {
    const vertices = await fetchClassesSchema(sparqlFetch, remoteLogger);
    const totalVertices = vertices.reduce((total, vertex) => {
      return total + (vertex.total ?? 0);
    }, 0);

    const edges = await fetchPredicatesSchema(sparqlFetch, remoteLogger);
    const totalEdges = edges.reduce((total, edge) => {
      return total + (edge.total ?? 0);
    }, 0);

    remoteLogger.info(
      `[SPARQL Explorer] Schema sync successful (${totalVertices} vertices; ${totalEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types)`
    );

    return {
      totalVertices,
      vertices,
      totalEdges,
      edges,
    };
  }

  // Exclude classes that start with one of the metadata class base URIs
  const classes = summary.classes.filter(
    c => !metadataClassBaseUris.some(uri => c.startsWith(uri))
  );

  const vertices = await fetchPredicatesByClass(
    sparqlFetch,
    remoteLogger,
    classes,
    {}
  );
  const edges = summary.predicates.flatMap(pred => {
    return Object.entries(pred).map(([type, count]) => {
      return {
        type,
        total: count,
        attributes: [],
      };
    });
  });

  remoteLogger.info(
    `[SPARQL Explorer] Schema sync successful (${summary.numDistinctSubjects} vertices; ${summary.numQuads} edges; ${vertices.length} vertex types; ${edges.length} edge types)`
  );

  return {
    totalVertices: summary.numDistinctSubjects,
    vertices,
    totalEdges: summary.numQuads,
    edges,
  };
};

export default fetchSchema;
