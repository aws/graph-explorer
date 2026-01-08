import { createVertexId, type EntityRawId } from "@/core";
import { neighborCounts } from "./neighborCounts";
import { query } from "@/utils";
import type { NeighborCount } from "../useGEFetchTypes";
import {
  createGMap,
  createGremlinResponse,
  createRandomVertexId,
} from "@/utils/testing";
import type { GMap } from "./types";

describe("neighborCounts", () => {
  it("should return empty for an empty request", async () => {
    const mockFetch = vi.fn();

    const result = await neighborCounts(mockFetch, { vertexIds: [] });

    expect(result.counts).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return neighbor counts", async () => {
    const expected: NeighborCount = {
      vertexId: createRandomVertexId(),
      totalCount: 12,
      counts: new Map([
        ["label1", 3],
        ["label2", 9],
      ]),
    };
    const response = createResponse(expected);
    const mockFetch = vi.fn().mockResolvedValue(response);
    const result = await neighborCounts(mockFetch, {
      vertexIds: [expected.vertexId],
    });
    expect(result.counts).toEqual([expected]);
  });

  it("should return neighbor counts with multiple labels", async () => {
    const expected: NeighborCount = {
      vertexId: createRandomVertexId(),
      totalCount: 12,
      counts: new Map([
        ["label1", 3],
        ["label2", 9],
        ["label3", 9],
      ]),
    };
    const response = createResponse({
      vertexId: expected.vertexId,
      totalCount: expected.totalCount,
      counts: new Map([
        ["label1", expected.counts.get("label1")!],
        ["label2::label3", expected.counts.get("label2")!],
      ]),
    });
    const mockFetch = vi.fn().mockResolvedValue(response);
    const result = await neighborCounts(mockFetch, {
      vertexIds: [expected.vertexId],
    });
    expect(result.counts).toEqual([expected]);
  });

  it("should return multiple neighbor counts", async () => {
    const expected1: NeighborCount = {
      vertexId: createRandomVertexId(),
      totalCount: 12,
      counts: new Map([
        ["label1", 3],
        ["label2", 9],
      ]),
    };
    const expected2: NeighborCount = {
      vertexId: createRandomVertexId(),
      totalCount: 12,
      counts: new Map([
        ["label1", 3],
        ["label2", 9],
      ]),
    };
    const response = createResponse(expected1, expected2);
    const mockFetch = vi.fn().mockResolvedValue(response);
    const result = await neighborCounts(mockFetch, {
      vertexIds: [expected1.vertexId, expected2.vertexId],
    });
    expect(result.counts).toEqual([expected1, expected2]);
  });

  it("Should return a template for the given vertex id", async () => {
    const mockFetch = vi.fn();

    await neighborCounts(mockFetch, {
      vertexIds: [createVertexId("12")],
    }).catch(() => null);

    expect(mockFetch).toHaveBeenCalledWith(query`
      g.V("12")
       .group()
       .by(id)
       .by(
         both().dedup().group().by(label).by(count())
       )
    `);
  });

  it("Should return a template for the given vertex id with number type", async () => {
    const mockFetch = vi.fn();

    await neighborCounts(mockFetch, {
      vertexIds: [createVertexId(12)],
    }).catch(() => null);

    expect(mockFetch).toHaveBeenCalledWith(query`
      g.V(12L)
       .group()
       .by(id)
       .by(
         both().dedup().group().by(label).by(count())
       )
    `);
  });

  it("should handle error response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      code: 500,
      detailedMessage: "Internal server error occurred",
    });

    await expect(
      neighborCounts(mockFetch, {
        vertexIds: [createVertexId("123")],
      }),
    ).rejects.toThrow("Internal server error occurred");
  });

  it("should handle empty response data", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(createGremlinResponse(createGMap({})));

    const result = await neighborCounts(mockFetch, {
      vertexIds: [createVertexId("123")],
    });

    expect(result.counts).toEqual([]);
  });

  it("should handle vertex with zero neighbors", async () => {
    const vertexId = createRandomVertexId();
    const expected: NeighborCount = {
      vertexId,
      totalCount: 0,
      counts: new Map(),
    };
    const response = createResponse(expected);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await neighborCounts(mockFetch, {
      vertexIds: [vertexId],
    });

    expect(result.counts).toEqual([expected]);
  });

  it("should handle mixed vertex ID types", async () => {
    const stringId = createVertexId("string-id");
    const numberId = createVertexId(42);
    const expected1: NeighborCount = {
      vertexId: stringId,
      totalCount: 5,
      counts: new Map([["type1", 5]]),
    };
    const expected2: NeighborCount = {
      vertexId: numberId,
      totalCount: 3,
      counts: new Map([["type2", 3]]),
    };
    const response = createResponse(expected1, expected2);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await neighborCounts(mockFetch, {
      vertexIds: [stringId, numberId],
    });

    expect(result.counts).toHaveLength(2);
    expect(result.counts).toEqual(
      expect.arrayContaining([
        expect.objectContaining(expected1),
        expect.objectContaining(expected2),
      ]),
    );
  });
});

function createResponse(...counts: NeighborCount[]) {
  return createGremlinResponse(
    createGMap(
      counts.reduce((prev, curr) => {
        prev.set(curr.vertexId, createGMap(curr.counts));
        return prev;
      }, new Map<EntityRawId, GMap>()),
    ),
  );
}
