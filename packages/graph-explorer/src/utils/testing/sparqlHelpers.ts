import { ScalarValue } from "@/connector/entities";
import { TestableEdge, TestableVertex } from "./randomData";
import { rdfTypeUri, SparqlQuadBinding } from "@/connector/sparql/types";

export function createUriValue(value: string) {
  return {
    type: "uri" as const,
    value,
  };
}

export function createBNodeValue(value: string) {
  return {
    type: "bnode" as const,
    value,
  };
}

export function createLiteralValue(value: Exclude<ScalarValue, null>) {
  if (typeof value === "number") {
    return {
      type: "literal" as const,
      value: value.toString(),
      datatype: value.toString().includes(".")
        ? ("http://www.w3.org/2001/XMLSchema#decimal" as const)
        : ("http://www.w3.org/2001/XMLSchema#integer" as const),
    };
  }

  if (typeof value === "boolean") {
    return {
      type: "literal",
      value: value.toString(),
      datatype: "http://www.w3.org/2001/XMLSchema#boolean",
    };
  }

  if (value instanceof Date) {
    return {
      type: "literal" as const,
      value: value.toISOString(),
      datatype: "http://www.w3.org/2001/XMLSchema#dateTime" as const,
    };
  }

  return {
    type: "literal" as const,
    value: value.toString(),
  };
}

/** Maps the provided testable entities in to SPARQL quad bindings. */
export function createQuadBindingsForEntities(
  vertices: TestableVertex[],
  edges: TestableEdge[]
): SparqlQuadBinding[] {
  return [
    ...vertices.flatMap(createBindingsForVertex),
    ...edges.flatMap(createBindingsForEdge),
  ];
}

function createBindingsForVertex(vertex: TestableVertex) {
  const subject = vertex.isBlankNode
    ? createBNodeValue(String(vertex.id))
    : createUriValue(String(vertex.id));

  return [
    // Vertex types
    ...vertex.types.map(type => ({
      subject,
      predicate: createUriValue(rdfTypeUri),
      object: createUriValue(type),
    })),
    // Vertex properties
    ...Object.entries(vertex.attributes).map(([key, value]) => ({
      subject,
      predicate: createUriValue(key),
      object: createLiteralValue(value),
    })),
  ];
}

function createBindingsForEdge(edge: TestableEdge) {
  const subject = edge.source.isBlankNode
    ? createBNodeValue(String(edge.source.id))
    : createUriValue(String(edge.source.id));
  const object = edge.target.isBlankNode
    ? createBNodeValue(String(edge.target.id))
    : createUriValue(String(edge.target.id));

  return [
    // Relationship between resources
    {
      subject: subject,
      predicate: createUriValue(edge.type),
      object: object,
    },
  ];
}

/** Creates the SPARQL response object with the given quad bindings */
export function createQuadSparqlResponse(bindings: SparqlQuadBinding[]) {
  return {
    head: { vars: ["subject", "predicate", "object", "context"] },
    results: { bindings },
  };
}
