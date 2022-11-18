import { PrefixTypeConfig } from "../../../core";
import generatePrefixes from "../../../utils/generatePrefixes";
import { SchemaResponse } from "../../AbstractConnector";
import classesWithCountsTemplates from "../templates/classesWithCountsTemplates";
import predicatesByClassTemplate from "../templates/predicatesByClassTemplate";
import predicatesWithCountsTemplate from "../templates/predicatesWithCountsTemplate";
import { RawValue, SparqlFetch } from "../types";

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

const fetchClassesSchema = async (sparqlFetch: SparqlFetch) => {
  const classesTemplate = classesWithCountsTemplates();
  const classesCounts = await sparqlFetch<RawClassesWCountsResponse>(
    classesTemplate
  );

  const vertices: SchemaResponse["vertices"] = [];
  await Promise.all(
    classesCounts.results.bindings.map(async classResult => {
      const classPredicatesTemplate = predicatesByClassTemplate({
        class: classResult.class.value,
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
        type: classResult.class.value,
        displayLabel: "",
        total: Number(classResult.instancesCount.value),
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
  prefixes: PrefixTypeConfig[] = []
): Promise<SchemaResponse> => {
  const vertices = await fetchClassesSchema(sparqlFetch);
  const edges = await fetchPredicatesSchema(sparqlFetch);

  const uris = vertices.flatMap(v => [
    v.type,
    ...v.attributes.map(attr => attr.name),
  ]);

  uris.push(...edges.map(e => e.type));
  const genPrefixes = generatePrefixes(uris, prefixes);

  return {
    vertices,
    edges,
    prefixes: genPrefixes,
  };
};

export default fetchSchema;
