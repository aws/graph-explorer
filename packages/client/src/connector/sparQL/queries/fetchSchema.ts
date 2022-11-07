import groupBy from "lodash/groupBy";
import { PrefixTypeConfig } from "../../../core";
import generatePrefixes from "../../../utils/generatePrefixes";
import { SchemaResponse } from "../../AbstractConnector";
import edgeLabelsTemplate from "../templates/edgeLabelsTemplate";
import verticesSchemaAndCountsTemplate from "../templates/verticesSchemaAndCountsTemplate";
import { RawValue, SparqlFetch } from "../types";

type RawVerticesAndCountsResponse = {
  results: {
    bindings: Array<{
      class: RawValue;
      instancesCount: RawValue;
      predicate: RawValue;
      object: RawValue;
    }>;
  };
};

type RawEdgeLabelsResponse = {
  head: {
    vars: ["edgeType", "count"];
  };
  results: {
    bindings: Array<{
      edgeType: {
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

const fetchVerticesSchemaOpt = async (sparqlFetch: SparqlFetch) => {
  const template = verticesSchemaAndCountsTemplate();
  const rawVertices = await sparqlFetch<RawVerticesAndCountsResponse>(template);

  const vertices: SchemaResponse["vertices"] = [];

  const groups = groupBy(
    rawVertices.results.bindings,
    result => result.class.value
  );

  Object.entries(groups).map(([vertexType, result]) => {
    const attributes = result
      .filter(item => item.object.type === "literal")
      .map(item => ({
        name: item.predicate.value,
        displayLabel: "",
        searchable: true,
        hidden: false,
        dataType: TYPE_MAP[item.predicate.datatype || ""] || "String",
      }));

    vertices.push({
      type: vertexType,
      displayLabel: "",
      total: Number(result[0].instancesCount.value),
      displayNameAttribute:
        attributes.find(attr => displayNameCandidates.includes(attr.name))
          ?.name || "__v_id",
      longDisplayNameAttribute:
        attributes.find(attr => displayDescCandidates.includes(attr.name))
          ?.name || "__v_types",
      attributes,
    });
  });

  return vertices;
};

const fetchEdgeLabels = async (
  sparqlFetch: SparqlFetch
): Promise<Record<string, number>> => {
  const labelsTemplate = edgeLabelsTemplate();
  const data = await sparqlFetch<RawEdgeLabelsResponse>(labelsTemplate);

  const values = data.results.bindings;
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 1) {
    labelsWithCounts[values[i].edgeType.value] = Number(values[i].count.value);
  }

  return labelsWithCounts;
};

const fetchEdgesSchema = async (sparqlFetch: SparqlFetch) => {
  const allLabels = await fetchEdgeLabels(sparqlFetch);

  return Object.entries(allLabels).map(([label, count]) => {
    return {
      type: label,
      displayLabel: "",
      total: count,
      attributes: [],
    };
  });
};

const fetchSchema = async (
  sparqlFetch: SparqlFetch,
  prefixes: PrefixTypeConfig[] = []
): Promise<SchemaResponse> => {
  const vertices = await fetchVerticesSchemaOpt(sparqlFetch);
  const edges = await fetchEdgesSchema(sparqlFetch);

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
