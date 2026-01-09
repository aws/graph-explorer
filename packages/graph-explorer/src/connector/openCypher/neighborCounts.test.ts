import { createRandomVertexId } from "@/utils/testing";
import type { NeighborCount } from "../useGEFetchTypes";
import { neighborCounts } from "./neighborCounts";
import { query } from "@/utils";
import { createVertexId, createVertexType } from "@/core";

describe("neighborCounts", () => {
  it("should return empty for empty request", async () => {
    const mockFetch = vi.fn();
    const result = await neighborCounts(mockFetch, { vertexIds: [] });
    expect(result).toEqual({ counts: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should generate template", async () => {
    const vertexId = createVertexId("123");
    const mockFetch = vi.fn();
    await neighborCounts(mockFetch, {
      vertexIds: [vertexId],
    }).catch(() => null);
    expect(mockFetch).toHaveBeenCalledWith(
      query`
        MATCH (source)--(neighbor)
        WHERE id(source) IN ["123"]
        WITH DISTINCT source, neighbor
        WITH 
          id(source) AS id, 
          labels(neighbor) AS neighborLabels, 
          count(neighbor) AS neighborCount
        RETURN id, collect({ label: neighborLabels, count: neighborCount }) as counts
      `,
    );
  });

  it("should return neighbor counts", async () => {
    const expected: NeighborCount = {
      vertexId: createRandomVertexId(),
      totalCount: 12,
      counts: new Map([
        [createVertexType("label1"), 3],
        [createVertexType("label2"), 9],
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
        [createVertexType("label1"), 3],
        [createVertexType("label2"), 9],
        [createVertexType("label3"), 9],
      ]),
    };
    const response = createResponse({
      vertexId: expected.vertexId,
      totalCount: expected.totalCount,
      counts: new Map([
        [
          createVertexType("label1"),
          expected.counts.get(createVertexType("label1"))!,
        ],
        [
          createVertexType("label2::label3"),
          expected.counts.get(createVertexType("label2"))!,
        ],
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
        [createVertexType("label1"), 3],
        [createVertexType("label2"), 9],
      ]),
    };
    const expected2: NeighborCount = {
      vertexId: createRandomVertexId(),
      totalCount: 12,
      counts: new Map([
        [createVertexType("label1"), 3],
        [createVertexType("label2"), 9],
      ]),
    };
    const response = createResponse(expected1, expected2);
    const mockFetch = vi.fn().mockResolvedValue(response);
    const result = await neighborCounts(mockFetch, {
      vertexIds: [expected1.vertexId, expected2.vertexId],
    });
    expect(result.counts).toEqual([expected1, expected2]);
  });

  it("should handle error response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      code: 500,
      detailedMessage: "openCypher query failed",
    });

    await expect(
      neighborCounts(mockFetch, {
        vertexIds: [createVertexId("123")],
      }),
    ).rejects.toThrow("openCypher query failed");
  });

  it("should handle empty results", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ results: [] });

    const result = await neighborCounts(mockFetch, {
      vertexIds: [createVertexId("123")],
    });

    expect(result.counts).toEqual([]);
  });

  it("should handle vertex with zero neighbors", async () => {
    const vertexId = createRandomVertexId();
    const response = {
      results: [
        {
          id: String(vertexId),
          counts: [],
        },
      ],
    };
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await neighborCounts(mockFetch, {
      vertexIds: [vertexId],
    });

    expect(result.counts).toEqual([
      {
        vertexId,
        totalCount: 0,
        counts: new Map(),
      },
    ]);
  });

  it("should handle malformed result data", async () => {
    const vertexId = createRandomVertexId();
    const response = {
      results: [
        {
          id: String(vertexId),
          // Missing counts property
        },
      ],
    };
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await neighborCounts(mockFetch, {
      vertexIds: [vertexId],
    });

    expect(result.counts).toEqual([]);
  });

  it("should handle single label neighbors", async () => {
    const vertexId = createRandomVertexId();
    const expected: NeighborCount = {
      vertexId,
      totalCount: 5,
      counts: new Map([[createVertexType("Person"), 5]]),
    };
    const response = {
      results: [
        {
          id: String(vertexId),
          counts: [
            {
              label: ["Person"],
              count: 5,
            },
          ],
        },
      ],
    };
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await neighborCounts(mockFetch, {
      vertexIds: [vertexId],
    });

    expect(result.counts).toEqual([expected]);
  });

  it("should handle empty label arrays", async () => {
    const vertexId = createRandomVertexId();
    const response = {
      results: [
        {
          id: String(vertexId),
          counts: [
            {
              label: [],
              count: 3,
            },
          ],
        },
      ],
    };
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await neighborCounts(mockFetch, {
      vertexIds: [vertexId],
    });

    expect(result.counts).toEqual([
      {
        vertexId,
        totalCount: 3,
        counts: new Map(),
      },
    ]);
  });
});

function createResponse(...counts: NeighborCount[]) {
  return {
    results: counts.map(count => ({
      id: String(count.vertexId),
      counts: Array.from(
        count.counts.entries().map(([type, countVal]) => ({
          label: type.split("::"),
          count: countVal,
        })),
      ),
    })),
  };
}
