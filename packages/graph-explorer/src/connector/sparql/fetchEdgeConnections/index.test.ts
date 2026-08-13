import { vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core";

import fetchEdgeConnections from ".";

function binding(edgeType: string, sourceType: string, targetType: string) {
  return {
    edgeType: { type: "uri", value: edgeType },
    sourceType: { type: "uri", value: sourceType },
    targetType: { type: "uri", value: targetType },
  };
}

describe("SPARQL > fetchEdgeConnections", () => {
  it("should batch all predicates into a single request and regroup by edge type", async () => {
    const sparqlFetch = vi.fn().mockResolvedValueOnce({
      results: {
        bindings: [
          binding(
            "http://example.org/knows",
            "http://example.org/Person",
            "http://example.org/Person",
          ),
          binding(
            "http://example.org/worksAt",
            "http://example.org/Person",
            "http://example.org/Company",
          ),
        ],
      },
    });

    const result = await fetchEdgeConnections(sparqlFetch, {
      edgeTypes: [
        createEdgeType("http://example.org/knows"),
        createEdgeType("http://example.org/worksAt"),
      ],
    });

    expect(sparqlFetch).toHaveBeenCalledTimes(1);
    expect(sparqlFetch).toHaveBeenCalledWith(
      expect.stringContaining("<http://example.org/knows>"),
    );
    expect(sparqlFetch).toHaveBeenCalledWith(
      expect.stringContaining("<http://example.org/worksAt>"),
    );
    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("http://example.org/Person"),
          edgeType: createEdgeType("http://example.org/knows"),
          targetVertexType: createVertexType("http://example.org/Person"),
        },
        {
          sourceVertexType: createVertexType("http://example.org/Person"),
          edgeType: createEdgeType("http://example.org/worksAt"),
          targetVertexType: createVertexType("http://example.org/Company"),
        },
      ],
    });
  });

  it("should split predicates into chunks of the batch size", async () => {
    const sparqlFetch = vi
      .fn()
      .mockResolvedValue({ results: { bindings: [] } });
    const edgeTypes = Array.from({ length: 250 }, (_, i) =>
      createEdgeType(`http://example.org/p${i}`),
    );

    await fetchEdgeConnections(sparqlFetch, { edgeTypes });

    // 250 predicates at a batch size of 100 => 3 requests
    expect(sparqlFetch).toHaveBeenCalledTimes(3);

    const queries = sparqlFetch.mock.calls.map(call => call[0] as string);
    // No request carries more than the batch size (one UNION arm per predicate)
    for (const q of queries) {
      expect((q.match(/AS \?edgeType/g) ?? []).length).toBeLessThanOrEqual(100);
    }
    // Every input predicate is covered across the requests
    const all = queries.join("\n");
    for (const type of edgeTypes) {
      expect(all).toContain(`<${type}>`);
    }
  });

  it("should return empty array when no edge types provided", async () => {
    const sparqlFetch = vi.fn();

    const result = await fetchEdgeConnections(sparqlFetch, { edgeTypes: [] });

    expect(sparqlFetch).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      edgeConnections: [],
    });
  });

  it("should return empty array when no edge connections exist", async () => {
    const sparqlFetch = vi.fn().mockResolvedValue(emptyResponse);

    const result = await fetchEdgeConnections(sparqlFetch, {
      edgeTypes: [createEdgeType("http://example.org/knows")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [],
    });
  });

  it("should filter out incomplete bindings", async () => {
    const sparqlFetch = vi.fn().mockResolvedValue({
      results: {
        bindings: [
          binding(
            "http://example.org/knows",
            "http://example.org/Person",
            "http://example.org/Person",
          ),
          {
            edgeType: { type: "uri", value: "http://example.org/knows" },
            sourceType: { type: "uri", value: "http://example.org/Person" },
            // Missing targetType
          },
        ],
      },
    });

    const result = await fetchEdgeConnections(sparqlFetch, {
      edgeTypes: [createEdgeType("http://example.org/knows")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("http://example.org/Person"),
          edgeType: createEdgeType("http://example.org/knows"),
          targetVertexType: createVertexType("http://example.org/Person"),
        },
      ],
    });
  });

  it("should propagate errors from fetch", async () => {
    const sparqlFetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(
      fetchEdgeConnections(sparqlFetch, {
        edgeTypes: [createEdgeType("http://example.org/knows")],
      }),
    ).rejects.toThrow("Network error");
  });

  it("should deduplicate edge connections within same edge type", async () => {
    const sparqlFetch = vi.fn().mockResolvedValueOnce({
      results: {
        bindings: [
          binding(
            "http://example.org/knows",
            "http://example.org/Person",
            "http://example.org/Person",
          ),
          binding(
            "http://example.org/knows",
            "http://example.org/Person",
            "http://example.org/Person",
          ),
        ],
      },
    });

    const result = await fetchEdgeConnections(sparqlFetch, {
      edgeTypes: [createEdgeType("http://example.org/knows")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("http://example.org/Person"),
          edgeType: createEdgeType("http://example.org/knows"),
          targetVertexType: createVertexType("http://example.org/Person"),
        },
      ],
    });
  });

  it("should handle resources with multiple rdf:type values", async () => {
    // In SPARQL, multiple types return as separate bindings
    const sparqlFetch = vi.fn().mockResolvedValueOnce({
      results: {
        bindings: [
          binding(
            "http://example.org/worksAt",
            "http://example.org/Person",
            "http://example.org/Company",
          ),
          binding(
            "http://example.org/worksAt",
            "http://example.org/Person",
            "http://example.org/Organization",
          ),
          binding(
            "http://example.org/worksAt",
            "http://example.org/Employee",
            "http://example.org/Company",
          ),
          binding(
            "http://example.org/worksAt",
            "http://example.org/Employee",
            "http://example.org/Organization",
          ),
        ],
      },
    });

    const result = await fetchEdgeConnections(sparqlFetch, {
      edgeTypes: [createEdgeType("http://example.org/worksAt")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("http://example.org/Person"),
          edgeType: createEdgeType("http://example.org/worksAt"),
          targetVertexType: createVertexType("http://example.org/Company"),
        },
        {
          sourceVertexType: createVertexType("http://example.org/Person"),
          edgeType: createEdgeType("http://example.org/worksAt"),
          targetVertexType: createVertexType("http://example.org/Organization"),
        },
        {
          sourceVertexType: createVertexType("http://example.org/Employee"),
          edgeType: createEdgeType("http://example.org/worksAt"),
          targetVertexType: createVertexType("http://example.org/Company"),
        },
        {
          sourceVertexType: createVertexType("http://example.org/Employee"),
          edgeType: createEdgeType("http://example.org/worksAt"),
          targetVertexType: createVertexType("http://example.org/Organization"),
        },
      ],
    });
  });
});

const emptyResponse = {
  results: {
    bindings: [],
  },
};
