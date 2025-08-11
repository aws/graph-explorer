import {
  MappedQueryResults,
  toMappedQueryResults,
} from "@/connector/useGEFetchTypes";
import { RawValue, rdfTypeUri } from "../types";
import { createEdge, createVertex, Vertex } from "@/core";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type RawOneHopNeighborsResponse = {
  results: {
    bindings: Array<{
      subject: RawValue;
      p: RawValue;
      value: RawValue;
    }>;
  };
};
type Bindings = RawOneHopNeighborsResponse["results"]["bindings"];

export function mapToResults(bindings: Bindings): MappedQueryResults {
  // Get types map
  const typesMap = getTypesMap(bindings);

  // Get node related triples
  const vertices = bindings
    .values()
    // Filter out type triples
    .filter(triple => triple.p.value !== rdfTypeUri)
    // Filter out non-literal values
    .filter(triple => triple.value.type === "literal")
    .reduce((vertices, current) => {
      // Get the types for the current node
      const uri = current.subject.value;
      const classes = typesMap.get(uri);

      if (!classes?.length) {
        // Nodes are only valid if they include at least one class
        return vertices;
      }

      // Get existing vertex or create a new one
      const vertex =
        vertices.get(uri) ??
        createVertex({
          id: uri,
          types: classes,
          isBlankNode: current.subject.type === "bnode",
          attributes: {},
        });

      // Add the attribute to the vertex
      vertex.attributes[current.p.value] =
        current.value.datatype === "http://www.w3.org/2001/XMLSchema#integer"
          ? Number(current.value.value)
          : current.value.value;

      return vertices.set(uri, vertex);
    }, new Map<string, Vertex>())
    .values()
    .toArray();

  // Get edge related triples
  const edges = bindings
    .values()
    .filter(
      triple =>
        triple.p.value !== rdfTypeUri &&
        (triple.subject.type === "uri" || triple.subject.type === "bnode") &&
        (triple.value.type === "uri" || triple.value.type === "bnode")
    )
    .map(triple => {
      const sourceClasses = typesMap.get(triple.subject.value);
      const targetClasses = typesMap.get(triple.value.value);

      if (!sourceClasses?.length || !targetClasses?.length) {
        return null;
      }

      const source = triple.subject.value;
      const target = triple.value.value;
      const uri = triple.p.value;

      return createEdge({
        id: createRdfEdgeId(source, uri, target),
        source: source,
        target: target,
        type: uri,
        attributes: {},
      });
    })
    .filter(edge => edge != null)
    .toArray();

  return toMappedQueryResults({ vertices, edges });
}

function getTypesMap(bindings: Bindings) {
  const typesMap = Map.groupBy(
    bindings.filter(item => item.p.value === rdfTypeUri),
    item => item.subject.value
  );

  return new Map(
    typesMap
      .entries()
      .map(([key, value]) => [key, value.map(v => v.value.value)])
  );
}
