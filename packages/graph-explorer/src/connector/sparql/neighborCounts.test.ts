import {
  createArray,
  createRandomName,
  createRandomUrlString,
} from "@shared/utils/testing";

import { createVertexId, createVertexType, type VertexType } from "@/core";
import {
  createLiteralValue,
  createQuadBindingsForEntities,
  createQuadSparqlResponse,
  createRandomEdgeForRdf,
  createRandomVertexForRdf,
  createTestableEdge,
  createTestableVertex,
  createUriValue,
} from "@/utils/testing";

import type { NeighborCount } from "../useGEFetchTypes";
import type { BlankNodesMap } from "./types";

import { neighborCounts } from "./neighborCounts";

describe("neighborCounts", () => {
  it("should return empty for an empty request", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const mockFetch = vi.fn();

    const result = await neighborCounts(
      mockFetch,
      { vertexIds: [] },
      blankNodes,
    );

    expect(result.counts).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return neighbor counts", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const expected: NeighborCount = {
      vertexId: createVertexId(createRandomUrlString()),
      totalCount: 12,
      counts: new Map([
        [createVertexType(createRandomUrlString()), 3],
        [createVertexType(createRandomUrlString()), 9],
      ]),
    };
    const totalCountResponse = createTotalCountResponse(expected);
    const countsByTypeResponse = createCountsByTypeResponse(expected);
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(totalCountResponse)
      .mockResolvedValueOnce(countsByTypeResponse);
    const result = await neighborCounts(
      mockFetch,
      {
        vertexIds: [expected.vertexId],
      },
      blankNodes,
    );
    expect(result.counts).toEqual([expected]);
  });

  it("should return multiple neighbor counts", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const expected1: NeighborCount = {
      vertexId: createVertexId(createRandomUrlString()),
      totalCount: 12,
      counts: new Map([
        [createVertexType(createRandomUrlString()), 3],
        [createVertexType(createRandomUrlString()), 9],
      ]),
    };
    const expected2: NeighborCount = {
      vertexId: createVertexId(createRandomUrlString()),
      totalCount: 12,
      counts: new Map([
        [createVertexType(createRandomUrlString()), 3],
        [createVertexType(createRandomUrlString()), 9],
      ]),
    };
    const totalCountResponse = createTotalCountResponse(expected1, expected2);
    const countsByTypeResponse = createCountsByTypeResponse(
      expected1,
      expected2,
    );
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(totalCountResponse)
      .mockResolvedValueOnce(countsByTypeResponse);
    const result = await neighborCounts(
      mockFetch,
      {
        vertexIds: [expected1.vertexId, expected2.vertexId],
      },
      blankNodes,
    );
    expect(result.counts).toEqual([expected1, expected2]);
  });

  it("should return blank node neighbor counts", async () => {
    const vertex = createRandomVertexForRdf();
    vertex.isBlankNode;
    const blankNodes: BlankNodesMap = new Map();
    const expected: NeighborCount = {
      vertexId: vertex.id,
      totalCount: 12,
      counts: new Map([
        [createVertexType(createRandomUrlString()), 3],
        [createVertexType(createRandomUrlString()), 9],
      ]),
    };
    blankNodes.set(expected.vertexId, {
      id: vertex.id,
      neighbors: {
        vertices: createArray(9, createRandomVertexForRdf),
        edges: createArray(3, () =>
          createRandomEdgeForRdf(
            createRandomVertexForRdf(),
            createRandomVertexForRdf(),
          ),
        ),
      },
      neighborCounts: {
        counts: expected.counts,
        totalCount: expected.totalCount,
      },
      vertex,
      subQueryTemplate: "",
    });
    const mockFetch = vi.fn();

    const result = await neighborCounts(
      mockFetch,
      {
        vertexIds: [expected.vertexId],
      },
      blankNodes,
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.counts).toEqual([expected]);
  });

  it("should fetch blank node neighbor counts", async () => {
    const vertex = createTestableVertex().withRdfValues({ isBlankNode: true });
    const neighborFrom = createTestableVertex().withRdfValues();
    const edgeFrom = createTestableEdge()
      .withRdfValues()
      .withSource(neighborFrom)
      .withTarget(vertex);
    const neighborTo = createTestableVertex().withRdfValues();
    const edgeTo = createTestableEdge()
      .withRdfValues()
      .withSource(vertex)
      .withTarget(neighborTo);
    const blankNodes: BlankNodesMap = new Map();
    blankNodes.set(vertex.id, {
      id: vertex.id,
      neighborCounts: {
        totalCount: 0,
        counts: new Map(),
      },
      vertex: vertex.asVertex(),
      subQueryTemplate: createRandomName("subQuery"),
    });

    const responseNeighbors = createQuadSparqlResponse(
      createQuadBindingsForEntities(
        [neighborFrom, neighborTo],
        [edgeFrom, edgeTo],
      ),
    );

    const mockFetch = vi.fn().mockReturnValueOnce(responseNeighbors);

    const expected: NeighborCount = {
      vertexId: vertex.id,
      totalCount: 2,
      counts: new Map([
        [neighborFrom.types[0], 1],
        [neighborTo.types[0], 1],
      ]),
    };

    const result = await neighborCounts(
      mockFetch,
      {
        vertexIds: [vertex.id],
      },
      blankNodes,
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.counts).toEqual([expected]);
    expect(blankNodes.get(vertex.id)?.neighborCounts.counts).toEqual(
      expected.counts,
    );
    expect(blankNodes.get(vertex.id)?.neighborCounts.totalCount).toEqual(
      expected.totalCount,
    );
    expect(blankNodes.get(vertex.id)?.neighbors?.vertices).toEqual([
      neighborFrom.asVertex(),
      neighborTo.asVertex(),
    ]);
    expect(blankNodes.get(vertex.id)?.neighbors?.edges).toEqual([
      edgeFrom.asEdge(),
      edgeTo.asEdge(),
    ]);
  });

  it("should handle error response for total counts", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const mockFetch = vi.fn().mockResolvedValue({
      code: 500,
      detailedMessage: "SPARQL query failed",
    });

    await expect(
      neighborCounts(
        mockFetch,
        { vertexIds: [createVertexId(createRandomUrlString())] },
        blankNodes,
      ),
    ).rejects.toThrow("Total neighbor count request failed");
  });

  it("should handle malformed response for total counts", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        head: { vars: ["resource", "totalCount"] },
        results: {
          bindings: [
            {
              resource: createUriValue("invalid"),
              totalCount: { type: "invalid", value: "not-a-number" },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        head: { vars: ["resource", "type", "typeCount"] },
        results: { bindings: [] },
      });

    await expect(
      neighborCounts(
        mockFetch,
        { vertexIds: [createVertexId(createRandomUrlString())] },
        blankNodes,
      ),
    ).rejects.toThrow();
  });

  it("should handle vertices with no neighbors", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const vertexId = createVertexId(createRandomUrlString());
    const expected: NeighborCount = {
      vertexId,
      totalCount: 0,
      counts: new Map<VertexType, number>(),
    };
    const totalCountResponse = createTotalCountResponse();
    const countsByTypeResponse = createCountsByTypeResponse();
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(totalCountResponse)
      .mockResolvedValueOnce(countsByTypeResponse);

    const result = await neighborCounts(
      mockFetch,
      { vertexIds: [vertexId] },
      blankNodes,
    );

    expect(result.counts).toEqual([expected]);
  });

  it("should handle mixed blank and non-blank nodes", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const blankVertex = createRandomVertexForRdf();
    blankVertex.isBlankNode = true;
    const nonBlankVertex = createVertexId(createRandomUrlString());

    const expectedBlank: NeighborCount = {
      vertexId: blankVertex.id,
      totalCount: 2,
      counts: new Map([[createVertexType(createRandomUrlString()), 2]]),
    };
    const expectedNonBlank: NeighborCount = {
      vertexId: nonBlankVertex,
      totalCount: 3,
      counts: new Map([[createVertexType(createRandomUrlString()), 3]]),
    };

    blankNodes.set(blankVertex.id, {
      id: blankVertex.id,
      neighbors: {
        vertices: createArray(2, createRandomVertexForRdf),
        edges: createArray(2, () =>
          createRandomEdgeForRdf(
            createRandomVertexForRdf(),
            createRandomVertexForRdf(),
          ),
        ),
      },
      neighborCounts: {
        counts: expectedBlank.counts,
        totalCount: expectedBlank.totalCount,
      },
      vertex: blankVertex,
      subQueryTemplate: "",
    });

    const totalCountResponse = createTotalCountResponse(expectedNonBlank);
    const countsByTypeResponse = createCountsByTypeResponse(expectedNonBlank);
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(totalCountResponse)
      .mockResolvedValueOnce(countsByTypeResponse);

    const result = await neighborCounts(
      mockFetch,
      { vertexIds: [blankVertex.id, nonBlankVertex] },
      blankNodes,
    );

    expect(result.counts).toEqual(
      expect.arrayContaining([expectedBlank, expectedNonBlank]),
    );
  });

  it("should handle blank node fetch failure", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const vertex = createRandomVertexForRdf();
    vertex.isBlankNode = true;

    blankNodes.set(vertex.id, {
      id: vertex.id,
      neighborCounts: { totalCount: 0, counts: new Map() },
      vertex,
      subQueryTemplate: createRandomName("subQuery"),
    });

    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(
      neighborCounts(mockFetch, { vertexIds: [vertex.id] }, blankNodes),
    ).rejects.toThrow("Network error");
  });
});

function createTotalCountResponse(...counts: NeighborCount[]) {
  return {
    head: {
      vars: ["resource", "totalCount"],
    },
    results: {
      bindings: counts.map(count => ({
        resource: createUriValue(String(count.vertexId)),
        totalCount: createLiteralValue(count.totalCount),
      })),
    },
  };
}

function createCountsByTypeResponse(...counts: NeighborCount[]) {
  return {
    head: {
      vars: ["resource", "type", "typeCount"],
    },
    results: {
      bindings: counts
        .flatMap(count =>
          Array.from(count.counts.entries()).map(([key, value]) => ({
            vertexId: count.vertexId,
            className: key,
            count: value,
          })),
        )
        .map(count => ({
          resource: createUriValue(String(count.vertexId)),
          type: createUriValue(count.className),
          typeCount: createLiteralValue(count.count),
        })),
    },
  };
}
