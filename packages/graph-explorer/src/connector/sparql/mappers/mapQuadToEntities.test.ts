import { mapQuadToEntities } from "./mapQuadToEntities";
import {
  createQuadBindingsForEntities,
  createTestableEdge,
  createTestableVertex,
} from "@/utils/testing";
import { createArray } from "@shared/utils/testing";

describe("mapQuadToEntities", () => {
  it("should map empty data to empty results", () => {
    const result = mapQuadToEntities([]);
    expect(result).toStrictEqual({ vertices: [], edges: [] });
  });

  it("should map vertices to results", () => {
    const vertices = createArray(3, () =>
      createTestableVertex().withRdfValues()
    );
    const edges = createArray(3, () => createTestableEdge().withRdfValues());
    const bindings = createQuadBindingsForEntities(vertices, edges);
    const result = mapQuadToEntities(bindings);
    expect(result).toStrictEqual({
      vertices: vertices.map(v => v.asResult()),
      edges: edges.map(e => e.asResult()),
    });
  });

  it("should map blank nodes to results", () => {
    const vertex = createTestableVertex().withRdfValues({ isBlankNode: true });

    const bindings = createQuadBindingsForEntities([vertex], []);
    const result = mapQuadToEntities(bindings);
    expect(result.vertices).toStrictEqual([vertex.asResult()]);
    expect(result.vertices[0].isBlankNode).toBe(true);
  });

  it("should map blank nodes and edges to results", () => {
    const node1 = createTestableVertex().withRdfValues({ isBlankNode: true });
    const node2 = createTestableVertex().withRdfValues({ isBlankNode: true });
    const edge = createTestableEdge()
      .withSource(node1)
      .withTarget(node2)
      .withRdfValues();

    const bindings = createQuadBindingsForEntities([node1, node2], [edge]);
    const result = mapQuadToEntities(bindings);

    expect(result.vertices).toStrictEqual([node1.asResult(), node2.asResult()]);
    expect(result.edges).toStrictEqual([edge.asResult()]);
  });

  it("should handle mixed URI and blank node edges", () => {
    const uriVertex = createTestableVertex().withRdfValues();
    const blankVertex = createTestableVertex().withRdfValues({
      isBlankNode: true,
    });
    const edge = createTestableEdge()
      .withSource(uriVertex)
      .withTarget(blankVertex)
      .withRdfValues();

    const bindings = createQuadBindingsForEntities(
      [uriVertex, blankVertex],
      [edge]
    );
    const result = mapQuadToEntities(bindings);

    expect(result.vertices).toStrictEqual([
      uriVertex.asResult(),
      blankVertex.asResult(),
    ]);
    expect(result.edges).toStrictEqual([edge.asResult()]);
  });

  it("should handle vertices with no attributes", () => {
    const vertex = createTestableVertex().withRdfValues().with({
      attributes: {},
    });

    const bindings = createQuadBindingsForEntities([vertex], []);
    const result = mapQuadToEntities(bindings);

    expect(result.vertices).toStrictEqual([vertex.asFragmentResult()]);
  });

  it("should handle vertices with no types", () => {
    const vertex = createTestableVertex().withRdfValues().with({
      types: [],
    });

    const bindings = createQuadBindingsForEntities([vertex], []);
    const result = mapQuadToEntities(bindings);

    expect(result.vertices).toEqual([vertex.asResult()]);
  });

  it("should handle duplicate vertex bindings correctly", () => {
    const vertex = createTestableVertex().withRdfValues();

    // Create bindings that would result in duplicate vertex data
    const bindings = [
      ...createQuadBindingsForEntities([vertex], []),
      ...createQuadBindingsForEntities([vertex], []), // Duplicate
    ];

    const result = mapQuadToEntities(bindings);

    // Should still only have one vertex, but with merged data
    expect(result.vertices).toStrictEqual([vertex.asResult()]);
  });
});
