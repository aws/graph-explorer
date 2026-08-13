import { chunk } from "lodash";

import type { LoggerConnector } from "@/connector/LoggerConnector";
import type {
  EdgeSchemaResponse,
  SchemaResponse,
} from "@/connector/useGEFetchTypes";

import {
  type AttributeConfig,
  createEdgeType,
  createVertexType,
  type VertexType,
} from "@/core";
import { defaultVertexTypeConfig } from "@/core/StateProvider/configuration";
import {
  DEFAULT_BATCH_REQUEST_SIZE,
  DEFAULT_CONCURRENT_REQUESTS_LIMIT,
  mapWithConcurrency,
} from "@/utils";

import type { GraphSummary, SparqlFetch, SparqlValue } from "../types";

import classesWithCountsTemplates from "./classesWithCountsTemplates";
import predicatesByClassTemplate from "./predicatesByClassTemplate";
import predicatesWithCountsTemplate from "./predicatesWithCountsTemplate";

type RawClassesWCountsResponse = {
  results: {
    bindings: Array<{
      class: SparqlValue;
      instancesCount: SparqlValue;
    }>;
  };
};
type RawPredicatesSamplesResponse = {
  results: {
    bindings: Array<{
      class: SparqlValue;
      pred: SparqlValue;
      sample: SparqlValue;
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
  classes: Array<VertexType>,
  countsByClass: Record<VertexType, number>,
) => {
  remoteLogger.info(
    `[SPARQL Explorer] Fetching predicates for ${classes.length} classes...`,
  );
  const batches = chunk(classes, DEFAULT_BATCH_REQUEST_SIZE);
  const responses = await mapWithConcurrency(
    batches,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    batch =>
      sparqlFetch<RawPredicatesSamplesResponse>(
        predicatesByClassTemplate({ classes: batch }),
      ),
  );

  // Regroup the flat (class, pred, sample) rows into a per-class attribute map,
  // keyed by the class IRI the arm projected. The response contract is an
  // unchecked assertion (no Zod at this boundary; see #2078), so guard each
  // field before use.
  const attributesByClass = new Map<string, Map<string, AttributeConfig>>();
  for (const response of responses) {
    for (const item of response.results?.bindings ?? []) {
      const resourceClass = item.class?.value;
      const name = item.pred?.value;
      if (!resourceClass || !name) {
        continue;
      }
      let attributes = attributesByClass.get(resourceClass);
      if (!attributes) {
        attributes = new Map<string, AttributeConfig>();
        attributesByClass.set(resourceClass, attributes);
      }
      attributes.set(name, {
        name,
        dataType: TYPE_MAP[item.sample?.datatype || ""] || "String",
      });
    }
  }

  return classes.map(resourceClass => {
    const attributes =
      attributesByClass.get(resourceClass) ??
      new Map<string, AttributeConfig>();
    return {
      type: createVertexType(resourceClass),
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
    };
  });
};

const fetchClassesSchema = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector,
) => {
  const classesTemplate = classesWithCountsTemplates();
  remoteLogger.info("[SPARQL Explorer] Fetching classes schema...");
  const classesCounts =
    await sparqlFetch<RawClassesWCountsResponse>(classesTemplate);

  const classes: Array<VertexType> = [];
  const countsByClass: Record<VertexType, number> = {};
  classesCounts.results.bindings
    // Exclude classes that start with one of the metadata class base URIs
    .filter(
      c => !metadataClassBaseUris.some(uri => c.class.value.startsWith(uri)),
    )
    .forEach(classResult => {
      const vertexType = createVertexType(classResult.class.value);
      classes.push(vertexType);
      countsByClass[vertexType] = Number(classResult.instancesCount.value);
    });

  return fetchPredicatesByClass(
    sparqlFetch,
    remoteLogger,
    classes,
    countsByClass,
  );
};

const fetchPredicatesWithCounts = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector,
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
  remoteLogger: LoggerConnector,
) => {
  const allLabels = await fetchPredicatesWithCounts(sparqlFetch, remoteLogger);

  return Object.entries(allLabels).map(([label, count]) => {
    return {
      type: createEdgeType(label),
      total: count,
      attributes: [],
    } satisfies EdgeSchemaResponse;
  });
};

/**
 * Fetch the database shape.
 * It follows this process:
 * 1. Fetch all distinct classes their counts
 * 2. Discover each class's literal predicates by sampling one instance per
 *    class, batching the classes into a few requests
 * 3. Fetch all predicates to non-literals and their counts
 * 4. Generate prefixes using the received URIs
 */
const fetchSchema = async (
  sparqlFetch: SparqlFetch,
  remoteLogger: LoggerConnector,
  summary?: GraphSummary,
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
      `[SPARQL Explorer] Schema sync successful (${totalVertices} vertices; ${totalEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types)`,
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
    c => !metadataClassBaseUris.some(uri => c.startsWith(uri)),
  ) as VertexType[];

  const vertices = await fetchPredicatesByClass(
    sparqlFetch,
    remoteLogger,
    classes,
    {},
  );
  const edges = summary.predicates.flatMap(pred => {
    return Object.entries(pred).map(([type, count]) => {
      return {
        type: createEdgeType(type),
        total: count,
        attributes: [],
      };
    });
  });

  remoteLogger.info(
    `[SPARQL Explorer] Schema sync successful (${summary.numDistinctSubjects} vertices; ${summary.numQuads} edges; ${vertices.length} vertex types; ${edges.length} edge types)`,
  );

  return {
    totalVertices: summary.numDistinctSubjects,
    vertices,
    totalEdges: summary.numQuads,
    edges,
  };
};

export default fetchSchema;
