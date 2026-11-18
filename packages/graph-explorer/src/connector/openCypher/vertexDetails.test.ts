import { describe, expect, it, vi } from "vite-plus/test";

import { createVertexId } from "@/core";
import { createTestableVertex, mapToOcVertex } from "@/utils/testing";

import type { ResultVertex } from "../entities";

import { vertexDetails } from "./vertexDetails";

describe("vertexDetails", () => {
  it("should return empty for empty request", async () => {
    const mockFetch = vi.fn();
    const result = await vertexDetails(mockFetch, { vertexIds: [] });
    expect(result.vertices).toStrictEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the vertex details", async () => {
    const vertex = createTestableVertex();

    const response = createResponse(vertex.asResult());
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(result.vertices).toStrictEqual([vertex.asVertex()]);
  });

  it("should return the vertex details for multiple vertices", async () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();

    const response = createResponse(vertex1.asResult(), vertex2.asResult());
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex1.id, vertex2.id],
    });

    expect(result.vertices).toStrictEqual([
      vertex1.asVertex(),
      vertex2.asVertex(),
    ]);
  });

  it("emits the exact query text for several IDs", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ results: [] });

    await vertexDetails(mockFetch, {
      vertexIds: [createVertexId('v"1'), createVertexId("v2")],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      [
        "MATCH (vertex)",
        'WHERE ID(vertex) in ["v\\"1","v2"]',
        "RETURN vertex",
      ].join("\n"),
    );
  });
});

function createResponse(...vertices: ResultVertex[]) {
  return {
    results: vertices.map(vertex => ({
      vertex: mapToOcVertex(vertex),
    })),
  };
}
