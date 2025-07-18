import { createRandomVertexId } from "@/utils/testing";
import { NeighborCount } from "../useGEFetchTypes";
import { neighborCounts } from "./neighborCounts";
import { query } from "@/utils";
import { createVertexId } from "@/core";

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
      `
    );
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

  it("should return neighbor counts", async () => {
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
});

function createResponse(...counts: NeighborCount[]) {
  return {
    results: counts.map(count => ({
      id: String(count.vertexId),
      counts: Object.entries(count.counts).map(([type, count]) => ({
        label: type.split("::"),
        count,
      })),
    })),
  };
}
