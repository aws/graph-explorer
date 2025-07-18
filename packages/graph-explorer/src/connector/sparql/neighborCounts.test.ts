import {
  createBNodeValue,
  createLiteralValue,
  createRandomEdgeForRdf,
  createRandomVertexForRdf,
  createUriValue,
} from "@/utils/testing";
import { NeighborCount } from "../useGEFetchTypes";
import { neighborCounts } from "./neighborCounts";
import { BlankNodesMap } from "./types";
import {
  createArray,
  createRandomName,
  createRandomUrlString,
} from "@shared/utils/testing";
import { createVertexId, Edge, Vertex } from "@/core";
import { parseEdgeId } from "./parseEdgeId";

describe("neighborCounts", () => {
  it("should return empty for an empty request", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const mockFetch = vi.fn();

    const result = await neighborCounts(
      mockFetch,
      { vertexIds: [] },
      blankNodes
    );

    expect(result.counts).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return neighbor counts", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const expected: NeighborCount = {
      vertexId: createVertexId(createRandomUrlString()),
      totalCount: 12,
      counts: {
        [`${createRandomUrlString()}`]: 3,
        [`${createRandomUrlString()}`]: 9,
      },
    };
    const response = createResponse(expected);
    const mockFetch = vi.fn().mockResolvedValue(response);
    const result = await neighborCounts(
      mockFetch,
      {
        vertexIds: [expected.vertexId],
      },
      blankNodes
    );
    expect(result.counts).toEqual([expected]);
  });

  it("should return multiple neighbor counts", async () => {
    const blankNodes: BlankNodesMap = new Map();
    const expected1: NeighborCount = {
      vertexId: createVertexId(createRandomUrlString()),
      totalCount: 12,
      counts: {
        [`${createRandomUrlString()}`]: 3,
        [`${createRandomUrlString()}`]: 9,
      },
    };
    const expected2: NeighborCount = {
      vertexId: createVertexId(createRandomUrlString()),
      totalCount: 12,
      counts: {
        [`${createRandomUrlString()}`]: 3,
        [`${createRandomUrlString()}`]: 9,
      },
    };
    const response = createResponse(expected1, expected2);
    const mockFetch = vi.fn().mockResolvedValue(response);
    const result = await neighborCounts(
      mockFetch,
      {
        vertexIds: [expected1.vertexId, expected2.vertexId],
      },
      blankNodes
    );
    expect(result.counts).toEqual([expected1, expected2]);
  });

  it("should return blank node neighbor counts", async () => {
    const vertex = createRandomVertexForRdf();
    vertex.__isBlank;
    const blankNodes: BlankNodesMap = new Map();
    const expected: NeighborCount = {
      vertexId: vertex.id,
      totalCount: 12,
      counts: {
        [`${createRandomUrlString()}`]: 3,
        [`${createRandomUrlString()}`]: 9,
      },
    };
    blankNodes.set(expected.vertexId, {
      id: vertex.id,
      neighbors: {
        vertices: createArray(9, createRandomVertexForRdf),
        edges: createArray(3, () =>
          createRandomEdgeForRdf(
            createRandomVertexForRdf(),
            createRandomVertexForRdf()
          )
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
      blankNodes
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.counts).toEqual([expected]);
  });

  it("should fetch blank node neighbor counts", async () => {
    const vertex = createRandomVertexForRdf();
    vertex.__isBlank;
    const neighborFrom = createRandomVertexForRdf();
    const edgeFrom = createRandomEdgeForRdf(neighborFrom, vertex);
    const neighborTo = createRandomVertexForRdf();
    const edgeTo = createRandomEdgeForRdf(vertex, neighborTo);
    const blankNodes: BlankNodesMap = new Map();
    blankNodes.set(vertex.id, {
      id: vertex.id,
      neighborCounts: {
        totalCount: 0,
        counts: {},
      },
      vertex,
      subQueryTemplate: createRandomName("subQuery"),
    });

    const responseNeighbors = createBlankNodeNeighbortsResponse(vertex, [
      neighborFrom,
      neighborTo,
    ]);
    const responsePredicates = createBlankNodePredicateResponse([
      { edge: edgeFrom, neighbor: neighborFrom },
      { edge: edgeTo, neighbor: neighborTo },
    ]);
    const mockFetch = vi
      .fn()
      // First fetch is for neighbors
      .mockReturnValueOnce(responseNeighbors)
      // Second fetch is for predicates
      .mockReturnValueOnce(responsePredicates);

    const expected: NeighborCount = {
      vertexId: vertex.id,
      totalCount: 2,
      counts: {
        [`${neighborFrom.type}`]: 1,
        [`${neighborTo.type}`]: 1,
      },
    };

    const result = await neighborCounts(
      mockFetch,
      {
        vertexIds: [vertex.id],
      },
      blankNodes
    );

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.counts).toEqual([expected]);
    expect(blankNodes.get(vertex.id)?.neighborCounts.counts).toEqual(
      expected.counts
    );
    expect(blankNodes.get(vertex.id)?.neighborCounts.totalCount).toEqual(
      expected.totalCount
    );
    expect(blankNodes.get(vertex.id)?.neighbors?.vertices).toEqual([
      neighborFrom,
      neighborTo,
    ]);
    expect(blankNodes.get(vertex.id)?.neighbors?.edges).toEqual([
      edgeFrom,
      edgeTo,
    ]);
  });
});

function createResponse(...counts: NeighborCount[]) {
  return {
    head: {
      vars: ["resource", "class", "count"],
    },
    results: {
      bindings: counts
        .flatMap(count =>
          Object.entries(count.counts).map(([key, value]) => ({
            vertexId: count.vertexId,
            className: key,
            count: value,
          }))
        )
        .map(count => ({
          resource: createUriValue(String(count.vertexId)),
          class: createUriValue(count.className),
          count: createLiteralValue(count.count),
        })),
    },
  };
}

function createBlankNodeNeighbortsResponse(bNode: Vertex, neighbors: Vertex[]) {
  const vertexBindings = neighbors.flatMap(neighbor =>
    createVertexResponse(neighbor)
  );
  return {
    head: {
      vars: ["bNode", "subject", "pred", "value", "subjectClass"],
    },
    results: {
      bindings: vertexBindings.flatMap(vBinding => ({
        ...vBinding,
        bNode: createUriValue(String(bNode.id)),
      })),
    },
  };
}

function createBlankNodePredicateResponse(
  relationships: { edge: Edge; neighbor: Vertex }[]
) {
  return {
    head: {
      vars: ["subject", "subjectClass", "pToSubject", "pFromSubject"],
    },
    results: {
      bindings: relationships.map(({ edge, neighbor }) => {
        const { subject, subjectClass } = createVertexResponse(neighbor)[0];
        const parts = parseEdgeId(edge.id);
        return {
          subject,
          subjectClass,
          predToSubject:
            edge.target === neighbor.id
              ? createUriValue(parts.predicate)
              : undefined,
          predFromSubject:
            edge.source === neighbor.id
              ? createUriValue(parts.predicate)
              : undefined,
        };
      }),
    },
  };
}

function createVertexResponse(vertex: Vertex) {
  return Object.entries(vertex.attributes).map(([key, value]) => ({
    subject: vertex.__isBlank
      ? createBNodeValue(String(vertex.id))
      : createUriValue(String(vertex.id)),
    subjectClass: createUriValue(String(vertex.type)),
    pred: createUriValue(key),
    value: createLiteralValue(value),
  }));
}
