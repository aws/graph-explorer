import { createLiteralValue, createUriValue } from "@/utils/testing";
import { NeighborCount } from "../useGEFetchTypes";
import { neighborCounts } from "./neighborCounts";
import { BlankNodesMap } from "./types";
import { createRandomUrlString } from "@shared/utils/testing";
import { createVertexId } from "@/core";

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
