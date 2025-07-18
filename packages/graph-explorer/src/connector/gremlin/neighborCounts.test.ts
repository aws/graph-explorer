import { createVertexId } from "@/core";
import { neighborCounts } from "./neighborCounts";
import { query } from "@/utils";
import { NeighborCount } from "../useGEFetchTypes";
import {
  createGMap,
  createGremlinResponse,
  createRandomVertexId,
} from "@/utils/testing";

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
      counts: {
        label1: 3,
        label2: 9,
      },
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
      counts: {
        label1: 3,
        label2: 9,
      },
    };
    const response = createResponse({
      ...expected,
      counts: {
        label1: expected.counts.label1,
        "label2::label3": expected.counts.label2,
      },
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
      counts: {
        label1: 3,
        label2: 9,
      },
    };
    const expected2: NeighborCount = {
      vertexId: createRandomVertexId(),
      totalCount: 12,
      counts: {
        label1: 3,
        label2: 9,
      },
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
});

function createResponse(...counts: NeighborCount[]) {
  return createGremlinResponse(
    createGMap(
      counts.reduce(
        (prev, curr) => {
          prev[String(curr.vertexId)] = createGMap(curr.counts);
          return prev;
        },
        {} as Record<string, any>
      )
    )
  );
}
