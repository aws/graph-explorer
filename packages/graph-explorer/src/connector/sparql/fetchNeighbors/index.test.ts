import { describe, test, expect, vi } from "vitest";
import fetchNeighbors from "./index";
import type { SPARQLNeighborsRequest } from "../types";
import {
  createTestableVertex,
  createTestableEdge,
  createQuadBindingsForEntities,
  createQuadSparqlResponse,
} from "@/utils/testing";
import { createRandomUrlString } from "@shared/utils/testing";
import { createVertex } from "@/core";

describe("fetchNeighbors", () => {
  const mockSparqlFetch = vi.fn() as any;

  test("should fetch neighbors successfully with valid response", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const neighborVertex = createTestableVertex().withRdfValues();
    const edge = createTestableEdge()
      .withSource(sourceVertex)
      .withTarget(neighborVertex)
      .withRdfValues();

    const bindings = createQuadBindingsForEntities(
      [sourceVertex, neighborVertex],
      [edge],
    );
    const mockResponse = createQuadSparqlResponse(bindings);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(mockSparqlFetch).toHaveBeenCalledOnce();
    expect(result.vertices).toStrictEqual([neighborVertex.asVertex()]);
    expect(result.edges).toStrictEqual([edge.asEdge()]);
  });

  test("should filter out source vertex from results", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const neighbor1 = createTestableVertex().withRdfValues();
    const neighbor2 = createTestableVertex().withRdfValues();

    const bindings = createQuadBindingsForEntities(
      [sourceVertex, neighbor1, neighbor2],
      [],
    );
    const mockResponse = createQuadSparqlResponse(bindings);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(result.vertices).toStrictEqual([
      neighbor1.asVertex(),
      neighbor2.asVertex(),
    ]);
  });

  test("should handle empty results", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const mockResponse = createQuadSparqlResponse([]);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(result.vertices).toStrictEqual([]);
    expect(result.edges).toStrictEqual([]);
  });

  test("should handle response with only source vertex", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };

    const bindings = createQuadBindingsForEntities([sourceVertex], []);
    const mockResponse = createQuadSparqlResponse(bindings);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(result.vertices).toStrictEqual([]);
    expect(result.edges).toStrictEqual([]);
  });

  test("should throw validation error for malformed SPARQL response", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const malformedResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          {
            subject: { type: "invalid", value: "test" }, // Invalid type
            predicate: { type: "uri", value: "http://example.com/pred" },
            object: { type: "literal", value: "test" },
          },
        ],
      },
    };
    mockSparqlFetch.mockResolvedValue(malformedResponse);

    // Act & Assert
    await expect(fetchNeighbors(mockSparqlFetch, request)).rejects.toThrow();
  });

  test("should throw validation error for missing required fields", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const invalidResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          {
            // Missing subject field
            predicate: { type: "uri", value: "http://example.com/pred" },
            object: { type: "literal", value: "test" },
          },
        ],
      },
    };
    mockSparqlFetch.mockResolvedValue(invalidResponse);

    // Act & Assert
    await expect(fetchNeighbors(mockSparqlFetch, request)).rejects.toThrow();
  });

  test("should throw validation error for response without head", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const invalidResponse = {
      // Missing head
      results: {
        bindings: [],
      },
    };
    mockSparqlFetch.mockResolvedValue(invalidResponse);

    // Act & Assert
    await expect(fetchNeighbors(mockSparqlFetch, request)).rejects.toThrow();
  });

  test("should throw validation error for response without results", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const invalidResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      // Missing results
    };
    mockSparqlFetch.mockResolvedValue(invalidResponse);

    // Act & Assert
    await expect(fetchNeighbors(mockSparqlFetch, request)).rejects.toThrow();
  });

  test("should handle blank node vertices correctly", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const blankNodeVertex = createTestableVertex().withRdfValues({
      isBlankNode: true,
    });
    const edge = createTestableEdge()
      .withSource(sourceVertex)
      .withTarget(blankNodeVertex)
      .withRdfValues();

    const bindings = createQuadBindingsForEntities(
      [sourceVertex, blankNodeVertex],
      [edge],
    );
    const mockResponse = createQuadSparqlResponse(bindings);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(result.vertices).toStrictEqual([blankNodeVertex.asVertex()]);
    expect(result.edges).toStrictEqual([edge.asEdge()]);
  });

  test("should pass request parameters to oneHopNeighborsTemplate", async () => {
    // Arrange
    const request: SPARQLNeighborsRequest = {
      resourceURI: createRandomUrlString() as any,
      subjectClasses: [createRandomUrlString()],
      filterCriteria: [
        { predicate: "http://example.com/name", object: "test" },
      ],
      excludedVertices: new Set([createRandomUrlString() as any]),
      limit: 10,
    };

    const mockResponse = createQuadSparqlResponse([]);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(mockSparqlFetch).toHaveBeenCalledOnce();
    const [queryTemplate] = mockSparqlFetch.mock.calls[0];

    // Verify the query template contains expected elements
    expect(queryTemplate).toContain(request.resourceURI);
    expect(queryTemplate).toContain("LIMIT 10");
  });

  test("should handle sparqlFetch rejection", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };
    const fetchError = new Error("Network error");
    mockSparqlFetch.mockRejectedValue(fetchError);

    // Act & Assert
    await expect(fetchNeighbors(mockSparqlFetch, request)).rejects.toThrow(
      "Network error",
    );
  });

  test("should add missing source vertex from edge to vertices results", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const targetVertex = createTestableVertex().withRdfValues();
    const edge = createTestableEdge()
      .withSource(sourceVertex)
      .withTarget(targetVertex)
      .withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: targetVertex.id,
    };

    // Only include target vertex in bindings, not the edge source
    const bindings = createQuadBindingsForEntities([targetVertex], [edge]);
    const mockResponse = createQuadSparqlResponse(bindings);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(result.vertices).toStrictEqual([
      createVertex({ id: edge.source.id }),
    ]);
    expect(result.edges).toStrictEqual([edge.asEdge()]);
  });

  test("should add missing target vertex from edge to vertices results", async () => {
    // Arrange
    const sourceVertex = createTestableVertex().withRdfValues();
    const targetVertex = createTestableVertex().withRdfValues();
    const edge = createTestableEdge()
      .withSource(sourceVertex)
      .withTarget(targetVertex)
      .withRdfValues();
    const request: SPARQLNeighborsRequest = {
      resourceURI: sourceVertex.id,
    };

    // Only include source vertex in bindings, not the edge source
    const bindings = createQuadBindingsForEntities([sourceVertex], [edge]);
    const mockResponse = createQuadSparqlResponse(bindings);
    mockSparqlFetch.mockResolvedValue(mockResponse);

    // Act
    const result = await fetchNeighbors(mockSparqlFetch, request);

    // Assert
    expect(result.vertices).toStrictEqual([
      createVertex({ id: edge.target.id }),
    ]);
    expect(result.edges).toStrictEqual([edge.asEdge()]);
  });
});
