import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, beforeEach } from "vitest";
import {
  updateDetailsCacheFromEntities,
  setVertexDetailsQueryCache,
  setEdgeDetailsQueryCache,
  updateNeighborCountCache,
  getExplorer,
} from "./helpers";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { neighborsCountQuery } from "./neighborsCountQuery";
import { emptyExplorer } from "../emptyExplorer";
import {
  createTestableVertex,
  createTestableEdge,
  FakeExplorer,
  createRandomEntityAttribute,
} from "@/utils/testing";
import { createResultScalar } from "@/core/entities/scalar";
import { createResultBundle } from "@/core/entities/bundle";
import { NeighborCount } from "../useGEFetchTypes";
import { createQueryClient, GraphExplorerMeta } from "@/core/queryClient";
import { createRandomName, createRecord } from "@shared/utils/testing";
import { EdgeId, VertexId } from "@/core";

describe("helpers", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient({ explorer: new FakeExplorer() });
  });

  function getCachedVertex(vertexId: VertexId) {
    return queryClient.getQueryData(vertexDetailsQuery(vertexId).queryKey);
  }

  function getCachedEdge(edgeId: EdgeId) {
    return queryClient.getQueryData(edgeDetailsQuery(edgeId).queryKey);
  }

  function getCachedNeighborCount(vertexId: VertexId) {
    return queryClient.getQueryData(neighborsCountQuery(vertexId).queryKey);
  }

  describe("updateDetailsCacheFromEntities", () => {
    it("should handle empty entities array", () => {
      updateDetailsCacheFromEntities(queryClient, []);

      // No queries should be cached
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it("should cache vertex details for vertices with attributes", () => {
      const vertex = createTestableVertex();

      updateDetailsCacheFromEntities(queryClient, [vertex.asResult()]);

      const cachedData = getCachedVertex(vertex.id);
      expect(cachedData).toStrictEqual({
        vertex: vertex.asVertex(),
      });
    });

    it("should cache edge details for edges with attributes", () => {
      const edge = createTestableEdge();

      updateDetailsCacheFromEntities(queryClient, [edge.asResult()]);

      const cachedData = getCachedEdge(edge.id);
      expect(cachedData).toStrictEqual({
        edge: edge.asEdge(),
      });
    });

    it("should cache vertex details for vertices with empty attributes", () => {
      const vertex = createTestableVertex().with({ attributes: {} });

      updateDetailsCacheFromEntities(queryClient, [vertex.asResult()]);

      const cachedData = getCachedVertex(vertex.id);
      expect(cachedData).toStrictEqual({
        vertex: vertex.asVertex(),
      });
    });

    it("should cache edge details for edges with empty attributes", () => {
      const edge = createTestableEdge().with({ attributes: {} });

      updateDetailsCacheFromEntities(queryClient, [edge.asResult()]);

      const cachedData = getCachedEdge(edge.id);
      expect(cachedData).toStrictEqual({
        edge: edge.asEdge(),
      });
    });

    it("should not cache vertex details for vertices without attributes", () => {
      const vertex = createTestableVertex();

      updateDetailsCacheFromEntities(queryClient, [vertex.asFragmentResult()]);

      const cachedData = getCachedVertex(vertex.id);
      expect(cachedData).toBeUndefined();
    });

    it("should not cache edge details for edges without attributes", () => {
      const edge = createTestableEdge();

      updateDetailsCacheFromEntities(queryClient, [edge.asFragmentResult()]);

      const cachedData = getCachedEdge(edge.id);
      expect(cachedData).toBeUndefined();
    });

    it("should ignore scalar entities", () => {
      const scalar = createResultScalar({ value: "test" });

      updateDetailsCacheFromEntities(queryClient, [scalar]);

      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it("should handle mixed entities with and without attributes", () => {
      const vertexWithAttrs = createTestableVertex();
      const vertexWithoutAttrs = createTestableVertex();
      const edgeWithAttrs = createTestableEdge();
      const edgeWithoutAttrs = createTestableEdge();
      const scalar = createResultScalar({ value: "test" });

      updateDetailsCacheFromEntities(queryClient, [
        vertexWithAttrs.asResult(),
        vertexWithoutAttrs.asFragmentResult(),
        edgeWithAttrs.asResult(),
        edgeWithoutAttrs.asFragmentResult(),
        scalar,
      ]);

      // Only entities with attributes should be cached
      expect(getCachedVertex(vertexWithAttrs.id)).toStrictEqual({
        vertex: vertexWithAttrs.asVertex(),
      });
      expect(getCachedEdge(edgeWithAttrs.id)).toStrictEqual({
        edge: edgeWithAttrs.asEdge(),
      });
      expect(getCachedVertex(vertexWithoutAttrs.id)).toBeUndefined();
      expect(getCachedEdge(edgeWithoutAttrs.id)).toBeUndefined();
    });

    it("should recursively process entities within bundles", () => {
      const vertex = createTestableVertex();
      const edge = createTestableEdge();
      const scalar = createResultScalar({ value: "test" });

      const bundle = createResultBundle({
        name: "test-bundle",
        values: [vertex.asResult(), edge.asResult(), scalar],
      });

      updateDetailsCacheFromEntities(queryClient, [bundle]);

      expect(getCachedVertex(vertex.id)).toStrictEqual({
        vertex: vertex.asVertex(),
      });
      expect(getCachedEdge(edge.id)).toStrictEqual({
        edge: edge.asEdge(),
      });
    });

    it("should handle nested bundles", () => {
      const vertex1 = createTestableVertex();
      const vertex2 = createTestableVertex();
      const edge = createTestableEdge();

      const innerBundle = createResultBundle({
        name: "inner-bundle",
        values: [vertex1.asResult(), edge.asResult()],
      });

      const outerBundle = createResultBundle({
        name: "outer-bundle",
        values: [vertex2.asResult(), innerBundle],
      });

      updateDetailsCacheFromEntities(queryClient, [outerBundle]);

      expect(getCachedVertex(vertex1.id)).toStrictEqual({
        vertex: vertex1.asVertex(),
      });
      expect(getCachedVertex(vertex2.id)).toStrictEqual({
        vertex: vertex2.asVertex(),
      });
      expect(getCachedEdge(edge.id)).toStrictEqual({
        edge: edge.asEdge(),
      });
    });

    it("should handle empty bundles", () => {
      const bundle = createResultBundle({
        name: "empty-bundle",
        values: [],
      });

      updateDetailsCacheFromEntities(queryClient, [bundle]);

      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it("should handle mixed standalone entities and bundles", () => {
      const standaloneVertex = createTestableVertex();
      const bundledVertex = createTestableVertex();
      const bundledEdge = createTestableEdge();

      const bundle = createResultBundle({
        name: "mixed-bundle",
        values: [bundledVertex.asResult(), bundledEdge.asResult()],
      });

      updateDetailsCacheFromEntities(queryClient, [
        standaloneVertex.asResult(),
        bundle,
      ]);

      expect(getCachedVertex(standaloneVertex.id)).toStrictEqual({
        vertex: standaloneVertex.asVertex(),
      });
      expect(getCachedVertex(bundledVertex.id)).toStrictEqual({
        vertex: bundledVertex.asVertex(),
      });
      expect(getCachedEdge(bundledEdge.id)).toStrictEqual({
        edge: bundledEdge.asEdge(),
      });
    });
  });

  describe("setVertexDetailsQueryCache", () => {
    it("should set vertex details in query cache", () => {
      const vertex = createTestableVertex();

      setVertexDetailsQueryCache(queryClient, vertex.asVertex());

      const cachedData = getCachedVertex(vertex.id);
      expect(cachedData).toStrictEqual({ vertex: vertex.asVertex() });
    });

    it("should overwrite existing cached vertex details", () => {
      const vertex1 = createTestableVertex();
      const vertex2 = vertex1.with({
        types: [createRandomName("type")],
        attributes: createRecord(3, createRandomEntityAttribute),
      });

      setVertexDetailsQueryCache(queryClient, vertex1.asVertex());
      setVertexDetailsQueryCache(queryClient, vertex2.asVertex());

      const cachedData = getCachedVertex(vertex1.id);
      expect(cachedData).toStrictEqual({ vertex: vertex2.asVertex() });
    });
  });

  describe("setEdgeDetailsQueryCache", () => {
    it("should set edge details in query cache", () => {
      const edge = createTestableEdge();

      setEdgeDetailsQueryCache(queryClient, edge.asEdge());

      const cachedData = getCachedEdge(edge.id);
      expect(cachedData).toStrictEqual({ edge: edge.asEdge() });
    });

    it("should overwrite existing cached edge details", () => {
      const edge1 = createTestableEdge();
      // Same edge with new attributes
      const edge2 = edge1.with({
        attributes: createRecord(3, createRandomEntityAttribute),
      });

      setEdgeDetailsQueryCache(queryClient, edge1.asEdge());
      setEdgeDetailsQueryCache(queryClient, edge2.asEdge());

      const cachedData = getCachedEdge(edge1.id);
      expect(cachedData).toStrictEqual({ edge: edge2.asEdge() });
    });
  });

  describe("updateNeighborCountCache", () => {
    it("should handle empty neighbor counts array", () => {
      updateNeighborCountCache(queryClient, []);

      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it("should cache neighbor counts for single vertex", () => {
      const vertex = createTestableVertex();
      const neighborCount: NeighborCount = {
        vertexId: vertex.id,
        totalCount: 5,
        counts: {
          Person: 3,
          Company: 2,
        },
      };

      updateNeighborCountCache(queryClient, [neighborCount]);

      const cachedData = getCachedNeighborCount(vertex.id);
      expect(cachedData).toEqual(neighborCount);
    });

    it("should cache neighbor counts for multiple vertices", () => {
      const vertex1 = createTestableVertex();
      const vertex2 = createTestableVertex();

      const neighborCounts: NeighborCount[] = [
        {
          vertexId: vertex1.id,
          totalCount: 3,
          counts: { Person: 3 },
        },
        {
          vertexId: vertex2.id,
          totalCount: 7,
          counts: { Company: 4, Product: 3 },
        },
      ];

      updateNeighborCountCache(queryClient, neighborCounts);

      expect(getCachedNeighborCount(vertex1.id)).toEqual(neighborCounts[0]);
      expect(getCachedNeighborCount(vertex2.id)).toEqual(neighborCounts[1]);
    });

    it("should overwrite existing neighbor count cache", () => {
      const vertex = createTestableVertex();

      const initialCount: NeighborCount = {
        vertexId: vertex.id,
        totalCount: 3,
        counts: { Person: 3 },
      };

      const updatedCount: NeighborCount = {
        vertexId: vertex.id,
        totalCount: 5,
        counts: { Person: 3, Company: 2 },
      };

      updateNeighborCountCache(queryClient, [initialCount]);
      updateNeighborCountCache(queryClient, [updatedCount]);

      const cachedData = getCachedNeighborCount(vertex.id);
      expect(cachedData).toEqual(updatedCount);
    });
  });

  describe("getExplorer", () => {
    it("should return explorer from meta when available", () => {
      const mockExplorer = {
        ...emptyExplorer,
        connection: {
          ...emptyExplorer.connection,
          url: "test-url",
        },
      };

      const meta: GraphExplorerMeta = {
        explorer: mockExplorer,
      };

      const result = getExplorer(meta);
      expect(result).toBe(mockExplorer);
    });

    it("should return emptyExplorer when meta is undefined", () => {
      const result = getExplorer(undefined);
      expect(result).toBe(emptyExplorer);
    });

    it("should return emptyExplorer when meta has no explorer", () => {
      const meta: GraphExplorerMeta = {};

      const result = getExplorer(meta);
      expect(result).toBe(emptyExplorer);
    });

    it("should return emptyExplorer when explorer is null", () => {
      const meta: GraphExplorerMeta = {
        explorer: null as any,
      };

      const result = getExplorer(meta);
      expect(result).toBe(emptyExplorer);
    });
  });
});
