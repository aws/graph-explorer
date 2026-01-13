import { createTestableEdge, createTestableVertex } from "@/utils/testing";

import { createPatchedResultBundle, createResultBundle } from "./bundle";
import { getAllGraphableEntities, getAllGraphableEntityIds } from "./entities";
import { createResultScalar } from "./scalar";

describe("entities", () => {
  describe("getAllGraphableEntityIds", () => {
    it("should return empty sets for empty array", () => {
      const result = getAllGraphableEntityIds([]);

      expect(result).toStrictEqual({
        vertexIds: new Set(),
        edgeIds: new Set(),
      });
    });

    it("should collect vertex IDs from result vertices", () => {
      const vertex1 = createTestableVertex().asResult();
      const vertex2 = createTestableVertex().asResult();

      const result = getAllGraphableEntityIds([vertex1, vertex2]);

      expect(result).toStrictEqual({
        vertexIds: new Set([vertex1.id, vertex2.id]),
        edgeIds: new Set(),
      });
    });

    it("should collect edge IDs and connected vertex IDs from result edges", () => {
      const edge = createTestableEdge();

      const result = getAllGraphableEntityIds([edge.asResult()]);

      expect(result).toStrictEqual({
        vertexIds: new Set([edge.source.id, edge.target.id]),
        edgeIds: new Set([edge.id]),
      });
    });

    it("should handle mixed vertices and edges", () => {
      const vertex = createTestableVertex().asResult();
      const edge = createTestableEdge().asResult();

      const result = getAllGraphableEntityIds([vertex, edge]);

      expect(result).toStrictEqual({
        vertexIds: new Set([vertex.id, edge.sourceId, edge.targetId]),
        edgeIds: new Set([edge.id]),
      });
    });

    it("should ignore scalar entities", () => {
      const scalar = createResultScalar({ value: "test" });
      const vertex = createTestableVertex().asResult();

      const result = getAllGraphableEntityIds([scalar, vertex]);

      expect(result).toStrictEqual({
        vertexIds: new Set([vertex.id]),
        edgeIds: new Set(),
      });
    });

    it("should deduplicate vertex IDs", () => {
      const vertex = createTestableVertex();
      const edge1 = createTestableEdge().withTarget(vertex);
      const edge2 = createTestableEdge().withSource(vertex);

      const result = getAllGraphableEntityIds([
        vertex.asResult(),
        edge1.asResult(),
        edge2.asResult(),
      ]);

      expect(result).toStrictEqual({
        vertexIds: new Set([vertex.id, edge1.source.id, edge2.target.id]),
        edgeIds: new Set([edge1.id, edge2.id]),
      });
    });

    it("should handle bundles with nested entities", () => {
      const vertex = createTestableVertex().asResult();
      const edge = createTestableEdge().asResult();
      const scalar = createResultScalar({ value: "test" });

      const bundle = createResultBundle({
        name: "test-bundle",
        values: [vertex, edge, scalar],
      });

      const result = getAllGraphableEntityIds([bundle]);

      expect(result).toStrictEqual({
        vertexIds: new Set([vertex.id, edge.sourceId, edge.targetId]),
        edgeIds: new Set([edge.id]),
      });
    });

    it("should handle nested bundles", () => {
      const vertex1 = createTestableVertex().asResult();
      const vertex2 = createTestableVertex().asResult();
      const edge = createTestableEdge().asResult();

      const innerBundle = createResultBundle({
        name: "inner-bundle",
        values: [vertex1, edge],
      });

      const outerBundle = createResultBundle({
        name: "outer-bundle",
        values: [vertex2, innerBundle],
      });

      const result = getAllGraphableEntityIds([outerBundle]);

      expect(result).toStrictEqual({
        vertexIds: new Set([
          vertex1.id,
          vertex2.id,
          edge.sourceId,
          edge.targetId,
        ]),
        edgeIds: new Set([edge.id]),
      });
    });

    it("should handle empty bundles", () => {
      const bundle = createResultBundle({
        name: "empty-bundle",
        values: [],
      });

      const result = getAllGraphableEntityIds([bundle]);

      expect(result).toStrictEqual({
        vertexIds: new Set(),
        edgeIds: new Set(),
      });
    });
  });

  describe("getAllGraphableEntities", () => {
    it("should return empty entities for empty array", () => {
      const result = getAllGraphableEntities([]);
      expect(result).toStrictEqual({ vertices: [], edges: [] });
    });

    it("should convert patched result vertices to vertices", () => {
      const vertex = createTestableVertex();

      const result = getAllGraphableEntities([
        vertex.asPatchedResult("Test Vertex"),
      ]);

      expect(result).toStrictEqual({
        vertices: [vertex.asVertex()],
        edges: [],
      });
    });

    it("should convert patched result edges to edges and include connected vertices", () => {
      const edge = createTestableEdge();

      const result = getAllGraphableEntities([
        edge.asPatchedResult("Test Edge"),
      ]);

      expect(result).toStrictEqual({
        vertices: [edge.source.asVertex(), edge.target.asVertex()],
        edges: [edge.asEdge()],
      });
    });

    it("should handle mixed patched vertices and edges", () => {
      const vertex = createTestableVertex();
      const edge = createTestableEdge();

      const result = getAllGraphableEntities([
        vertex.asPatchedResult("Standalone Vertex"),
        edge.asPatchedResult("Test Edge"),
      ]);

      expect(result).toStrictEqual({
        vertices: [
          vertex.asVertex(),
          edge.source.asVertex(),
          edge.target.asVertex(),
        ],
        edges: [edge.asEdge()],
      });
    });

    it("should ignore scalar entities", () => {
      const scalar = createResultScalar({ value: "test" });
      const vertex = createTestableVertex();

      const result = getAllGraphableEntities([
        scalar,
        vertex.asPatchedResult("Test Vertex"),
      ]);

      expect(result).toStrictEqual({
        vertices: [vertex.asVertex()],
        edges: [],
      });
    });

    it("should deduplicate vertices when multiple edges share vertices", () => {
      const edge1 = createTestableEdge();

      const edge2 = createTestableEdge()
        .withSource(edge1.target)
        .withTarget(edge1.source);

      const result = getAllGraphableEntities([
        edge1.asPatchedResult(),
        edge2.asPatchedResult(),
      ]);

      expect(result).toStrictEqual({
        vertices: [edge1.source.asVertex(), edge1.target.asVertex()],
        edges: [edge1.asEdge(), edge2.asEdge()],
      });
    });

    it("should handle patched bundles with nested entities", () => {
      const vertex = createTestableVertex();
      const edge = createTestableEdge();
      const scalar = createResultScalar({ value: "test" });

      const bundle = createPatchedResultBundle({
        name: "test-bundle",
        values: [vertex.asPatchedResult(), edge.asPatchedResult(), scalar],
      });

      const result = getAllGraphableEntities([bundle]);

      expect(result).toStrictEqual({
        vertices: [
          vertex.asVertex(),
          edge.source.asVertex(),
          edge.target.asVertex(),
        ],
        edges: [edge.asEdge()],
      });
    });

    it("should handle nested patched bundles", () => {
      const vertex1 = createTestableVertex();
      const vertex2 = createTestableVertex();
      const edge = createTestableEdge();

      const innerBundle = createPatchedResultBundle({
        name: "inner-bundle",
        values: [vertex1.asPatchedResult(), edge.asPatchedResult()],
      });

      const outerBundle = createPatchedResultBundle({
        name: "outer-bundle",
        values: [vertex2.asPatchedResult(), innerBundle],
      });

      const result = getAllGraphableEntities([outerBundle]);

      expect(result).toStrictEqual({
        vertices: [
          vertex2.asVertex(),
          vertex1.asVertex(),
          edge.source.asVertex(),
          edge.target.asVertex(),
        ],
        edges: [edge.asEdge()],
      });
    });

    it("should handle empty patched bundles", () => {
      const bundle = createPatchedResultBundle({
        name: "empty-bundle",
        values: [],
      });

      const result = getAllGraphableEntities([bundle]);

      expect(result).toStrictEqual({
        vertices: [],
        edges: [],
      });
    });

    it("should handle mixed entities and bundles", () => {
      const standaloneVertex = createTestableVertex();
      const standaloneEdge = createTestableEdge();
      const bundledVertex = createTestableVertex();
      const bundledEdge = createTestableEdge();

      const bundle = createPatchedResultBundle({
        name: "mixed-bundle",
        values: [
          bundledVertex.asPatchedResult(),
          bundledEdge.asPatchedResult(),
        ],
      });

      const result = getAllGraphableEntities([
        standaloneVertex.asPatchedResult(),
        standaloneEdge.asPatchedResult(),
        bundle,
      ]);

      expect(result).toStrictEqual({
        vertices: [
          standaloneVertex.asVertex(),
          standaloneEdge.source.asVertex(),
          standaloneEdge.target.asVertex(),
          bundledVertex.asVertex(),
          bundledEdge.source.asVertex(),
          bundledEdge.target.asVertex(),
        ],
        edges: [standaloneEdge.asEdge(), bundledEdge.asEdge()],
      });
    });
  });
});
