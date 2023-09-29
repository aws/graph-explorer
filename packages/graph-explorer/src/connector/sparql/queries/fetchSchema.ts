import { SchemaResponse } from "../../AbstractConnector";
import classesWithCountsTemplates from "../templates/classesWithCountsTemplates";
import predicatesByClassTemplate from "../templates/predicatesByClassTemplate";
import predicatesWithCountsTemplate from "../templates/predicatesWithCountsTemplate";
import { GraphSummary, RawValue, SparqlFetch } from "../types";

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
  classes: Array<string>,
  countsByClass: Record<string, number>
) => {
  const vertices: SchemaResponse["vertices"] = [];
  await Promise.all(
    classes.map(async classResult => {
      const classPredicatesTemplate = predicatesByClassTemplate({
        class: classResult,
      });
      const predicatesResponse = await sparqlFetch<
        RawPredicatesSamplesResponse
      >(classPredicatesTemplate);

      const attributes = predicatesResponse.results.bindings.map(item => ({
        name: item.pred.value,
        displayLabel: "",
        searchable: true,
        hidden: false,
        dataType: TYPE_MAP[item.sample.datatype || ""] || "String",
      }));

      vertices.push({
        type: classResult,
        displayLabel: "",
        total: countsByClass[classResult],
        displayNameAttribute:
          attributes.find(attr => displayNameCandidates.includes(attr.name))
            ?.name || "id",
        longDisplayNameAttribute:
          attributes.find(attr => displayDescCandidates.includes(attr.name))
            ?.name || "types",
        attributes,
      });
    })
  );

  return vertices;
};

const fetchClassesSchema = async (sparqlFetch: SparqlFetch) => {
  const classesTemplate = classesWithCountsTemplates();
  const classesCounts = await sparqlFetch<RawClassesWCountsResponse>(
    classesTemplate
  );

  const classes: Array<string> = [];
  const countsByClass: Record<string, number> = {};
  classesCounts.results.bindings.forEach(classResult => {
    classes.push(classResult.class.value);
    countsByClass[classResult.class.value] = Number(
      classResult.instancesCount.value
    );
  });

  return fetchPredicatesByClass(sparqlFetch, classes, countsByClass);
};

const fetchPredicatesWithCounts = async (
  sparqlFetch: SparqlFetch
): Promise<Record<string, number>> => {
  const template = predicatesWithCountsTemplate();
  const data = await sparqlFetch<RawPredicatesWCountsResponse>(template);

  const values = data.results.bindings;
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 1) {
    labelsWithCounts[values[i].predicate.value] = Number(values[i].count.value);
  }

  return labelsWithCounts;
};

const fetchPredicatesSchema = async (sparqlFetch: SparqlFetch) => {
  const allLabels = await fetchPredicatesWithCounts(sparqlFetch);

  return Object.entries(allLabels).map(([label, count]) => {
    return {
      type: label,
      displayLabel: "",
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
  summary?: GraphSummary
): Promise<SchemaResponse> => {
  if (!summary) {
    const vertices = await fetchClassesSchema(sparqlFetch);
    const totalVertices = vertices.reduce((total, vertex) => {
      return total + (vertex.total ?? 0);
    }, 0);

    const edges = await fetchPredicatesSchema(sparqlFetch);
    const totalEdges = edges.reduce((total, edge) => {
      return total + (edge.total ?? 0);
    }, 0);

    return {
      totalVertices,
      vertices,
      totalEdges,
      edges,
    };
  }

  const vertices = await fetchPredicatesByClass(
    sparqlFetch,
    summary.classes,
    {}
  );
  const edges = summary.predicates.flatMap(pred => {
    return Object.entries(pred).map(([type, count]) => {
      return {
        type,
        displayLabel: "",
        total: count,
        attributes: [],
      };
    });
  });

  return {
    totalVertices: summary.numDistinctSubjects,
    vertices,
    totalEdges: summary.numQuads,
    edges,
  };
};

export default fetchSchema;
