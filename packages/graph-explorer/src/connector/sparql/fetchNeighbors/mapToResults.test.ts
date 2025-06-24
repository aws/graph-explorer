import { toMappedQueryResults } from "@/connector";
import { mapToResults } from "./mapToResults";
import { Edge, EntityPropertyValue, Vertex } from "@/core";
import {
  createRandomEdgeForRdf,
  createRandomEntitiesForRdf,
  createRandomVertexForRdf,
} from "@/utils/testing";
import { rdfTypeUri } from "../types";

describe("mapToResults", () => {
  it("should map empty data to empty results", () => {
    const result = mapToResults([]);
    expect(result).toEqual(toMappedQueryResults({}));
  });
  it("should map vertices to results", () => {
    const entities = createRandomEntitiesForRdf();
    const bindings = createBindings(
      entities.nodes.values().toArray(),
      entities.edges.values().toArray()
    );
    const result = mapToResults(bindings);
    expect(result.vertices).toEqual(entities.nodes.values().toArray());
    expect(result.edges).toEqual(entities.edges.values().toArray());
  });
  it("should map blank nodes to results", () => {
    const vertex = createRandomVertexForRdf();
    vertex.__isBlank = true;

    const bindings = createBindings([vertex], []);
    const result = mapToResults(bindings);
    expect(result.vertices).toEqual([vertex]);
    expect(result.vertices[0].__isBlank).toBe(true);
  });
  it("should map blank nodes and edges to results", () => {
    const node1 = createRandomVertexForRdf();
    const node2 = createRandomVertexForRdf();
    node1.__isBlank = true;
    node2.__isBlank = true;

    const vertices = [node1, node2];
    const edges = [createRandomEdgeForRdf(node1, node2)];
    const bindings = createBindings(vertices, edges);
    const result = mapToResults(bindings);

    expect(result.vertices).toEqual(vertices);
    expect(result.edges).toEqual(edges);
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
    return { type: "literal", value };
  },
};

function createBindings(vertices: Vertex[], edges: Edge[]) {
  return [
    ...vertices.flatMap(createBindingForVertex),
    ...edges
      .map(edge => {
        // Gets the vertices to see if they are blank nodes
        const source = vertices.find(v => v.id === edge.source);
        const target = vertices.find(v => v.id === edge.target);
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
      value: rdfValue.literal(value),
    })),
  ].map(binding =>
    // Modify bindings to represent blank nodes
    vertex.__isBlank
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
  const isSourceBlank = source?.__isBlank ?? false;
  const isTargetBlank = target?.__isBlank ?? false;
  return [
    // Relationship between resources
    {
      subject: isSourceBlank
        ? rdfValue.blank(String(edge.source))
        : rdfValue.uri(String(edge.source)),
      p: rdfValue.uri(edge.type),
      value: isTargetBlank
        ? rdfValue.blank(String(edge.target))
        : rdfValue.uri(String(edge.target)),
    },
  ];
}
