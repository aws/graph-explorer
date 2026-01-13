import { vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core";

import fetchEdgeConnections from ".";

describe("SPARQL > fetchEdgeConnections", () => {
  it("should return edge connections from response", async () => {
    const sparqlFetch = vi
      .fn()
      .mockResolvedValueOnce(knowsResponse)
      .mockResolvedValueOnce(worksAtResponse);

    const result = await fetchEdgeConnections(sparqlFetch, {
      edgeTypes: [
        createEdgeType("http://example.org/knows"),
        createEdgeType("http://example.org/worksAt"),
      ],
    });

    expect(sparqlFetch).toHaveBeenCalledTimes(2);
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
    const sparqlFetch = vi.fn().mockResolvedValue(incompleteResponse);

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
    const duplicateResponse = {
      results: {
        bindings: [
          {
            sourceType: { type: "uri", value: "http://example.org/Person" },
            targetType: { type: "uri", value: "http://example.org/Person" },
          },
          {
            sourceType: { type: "uri", value: "http://example.org/Person" },
            targetType: { type: "uri", value: "http://example.org/Person" },
          },
        ],
      },
    };
    const sparqlFetch = vi.fn().mockResolvedValueOnce(duplicateResponse);

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
    const multiTypeResponse = {
      results: {
        bindings: [
          {
            sourceType: { type: "uri", value: "http://example.org/Person" },
            targetType: { type: "uri", value: "http://example.org/Company" },
          },
          {
            sourceType: { type: "uri", value: "http://example.org/Person" },
            targetType: {
              type: "uri",
              value: "http://example.org/Organization",
            },
          },
          {
            sourceType: { type: "uri", value: "http://example.org/Employee" },
            targetType: { type: "uri", value: "http://example.org/Company" },
          },
          {
            sourceType: { type: "uri", value: "http://example.org/Employee" },
            targetType: {
              type: "uri",
              value: "http://example.org/Organization",
            },
          },
        ],
      },
    };
    const sparqlFetch = vi.fn().mockResolvedValueOnce(multiTypeResponse);

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

const knowsResponse = {
  results: {
    bindings: [
      {
        sourceType: { type: "uri", value: "http://example.org/Person" },
        targetType: { type: "uri", value: "http://example.org/Person" },
      },
    ],
  },
};

const worksAtResponse = {
  results: {
    bindings: [
      {
        sourceType: { type: "uri", value: "http://example.org/Person" },
        targetType: { type: "uri", value: "http://example.org/Company" },
      },
    ],
  },
};

const emptyResponse = {
  results: {
    bindings: [],
  },
};

const incompleteResponse = {
  results: {
    bindings: [
      {
        sourceType: { type: "uri", value: "http://example.org/Person" },
        targetType: { type: "uri", value: "http://example.org/Person" },
      },
      {
        sourceType: { type: "uri", value: "http://example.org/Person" },
        // Missing targetType
      },
    ],
  },
};
