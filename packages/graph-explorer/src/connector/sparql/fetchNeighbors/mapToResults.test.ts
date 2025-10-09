import { mapToResults } from "./mapToResults";
import { type Edge, type EntityPropertyValue, type Vertex } from "@/core";
import {
  createLiteralValue,
  createRandomEdgeForRdf,
  createRandomEntitiesForRdf,
  createRandomVertexForRdf,
  createTestableVertex,
} from "@/utils/testing";
import { rdfTypeUri } from "../types";

describe("mapToResults", () => {
  it("should map empty data to empty results", () => {
    const result = mapToResults([]);
    expect(result).toStrictEqual({ vertices: [], edges: [] });
  });

  it("should map vertex with no attributes", () => {
    const vertex = createTestableVertex()
      .withRdfValues()
      .with({ attributes: {} })
      .asVertex();
    const bindings = createBindings([vertex], []);
    const result = mapToResults(bindings);
    expect(result).toStrictEqual({ vertices: [vertex], edges: [] });
  });

  it("should map vertices to results", () => {
    const entities = createRandomEntitiesForRdf();
    const bindings = createBindings(entities.vertices, entities.edges);
    const result = mapToResults(bindings);
    expect(result).toStrictEqual(entities);
  });
  it("should map blank nodes to results", () => {
    const vertex = createRandomVertexForRdf();
    vertex.isBlankNode = true;

    const bindings = createBindings([vertex], []);
    const result = mapToResults(bindings);
    expect(result.vertices).toStrictEqual([vertex]);
    expect(result.vertices[0].isBlankNode).toBe(true);
  });
  it("should map blank nodes and edges to results", () => {
    const node1 = createRandomVertexForRdf();
    const node2 = createRandomVertexForRdf();
    node1.isBlankNode = true;
    node2.isBlankNode = true;

    const vertices = [node1, node2];
    const edges = [createRandomEdgeForRdf(node1, node2)];
    const bindings = createBindings(vertices, edges);
    const result = mapToResults(bindings);

    expect(result.vertices).toStrictEqual(vertices);
    expect(result.edges).toStrictEqual(edges);
  });
});

const rdfValue = {
  uri(value: string) {
    return { type: "uri", value };
  },
  blank(value: string) {
    return { type: "bnode", value };
  },
  literal(value: EntityPropertyValue) {
    if (typeof value === "number") {
      return {
        type: "literal",
        datatype: "http://www.w3.org/2001/XMLSchema#integer",
        value: String(value),
      };
    }

    if (typeof value === "boolean") {
      return {
        type: "literal",
        value: String(value),
      };
    }

    return { type: "literal", value };
  },
};

function createBindings(vertices: Vertex[], edges: Edge[]) {
  return [
    ...vertices.flatMap(createBindingForVertex),
    ...edges
      .map(edge => {
        // Gets the vertices to see if they are blank nodes
        const source = vertices.find(v => v.id === edge.sourceId);
        const target = vertices.find(v => v.id === edge.targetId);
        return {
          edge,
          source,
          target,
        };
      })
      .flatMap(createBindingsForEdge),
  ];
}

function createBindingForVertex(vertex: Vertex) {
  return [
    // Vertex types
    ...vertex.types.map(type => ({
      subject: rdfValue.uri(String(vertex.id)),
      p: rdfValue.uri(rdfTypeUri),
      value: rdfValue.uri(type),
    })),
    // Vertex properties
    ...Object.entries(vertex.attributes).map(([key, value]) => ({
      subject: rdfValue.uri(String(vertex.id)),
      p: rdfValue.uri(key),
      value: createLiteralValue(value),
    })),
  ].map(binding =>
    // Modify bindings to represent blank nodes
    vertex.isBlankNode
      ? {
          ...binding,
          subject: {
            ...binding.subject,
            type: "bnode",
          },
        }
      : binding
  );
}

function createBindingsForEdge({
  edge,
  source,
  target,
}: {
  edge: Edge;
  source?: Vertex;
  target?: Vertex;
}) {
  const isSourceBlank = source?.isBlankNode ?? false;
  const isTargetBlank = target?.isBlankNode ?? false;
  return [
    // Relationship between resources
    {
      subject: isSourceBlank
        ? rdfValue.blank(String(edge.sourceId))
        : rdfValue.uri(String(edge.sourceId)),
      p: rdfValue.uri(edge.type),
      value: isTargetBlank
        ? rdfValue.blank(String(edge.targetId))
        : rdfValue.uri(String(edge.targetId)),
    },
  ];
}
