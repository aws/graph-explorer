import { describe, it, expect, vi } from "vitest";
import { rawQuery } from "./rawquery";
import {
  createResultScalar,
  createResultBundle,
  createResultVertex,
  createResultEdge,
} from "@/connector/entities";

describe("rawQuery", () => {
  it("should return empty array for empty query", async () => {
    const mockFetch = vi.fn();
    const result = await rawQuery(mockFetch, { query: "" });
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should parse SPARQL response with single variable", async () => {
    const mockResponse = {
      head: { vars: ["name"] },
      results: {
        bindings: [
          { name: { type: "literal", value: "John" } },
          { name: { type: "literal", value: "Jane" } },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "SELECT ?name WHERE { ?s ?p ?name }",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      createResultScalar({ name: "?name", value: "John" })
    );
    expect(result[1]).toEqual(
      createResultScalar({ name: "?name", value: "Jane" })
    );
  });

  it("should parse SPARQL response with multiple variables as bundles", async () => {
    const mockResponse = {
      head: { vars: ["name", "age"] },
      results: {
        bindings: [
          {
            name: { type: "literal", value: "John" },
            age: {
              type: "literal",
              datatype: "http://www.w3.org/2001/XMLSchema#integer",
              value: "30",
            },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "SELECT ?name ?age WHERE { ?s ?p ?name, ?age }",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      createResultBundle({
        values: [
          createResultScalar({ name: "?name", value: "John" }),
          createResultScalar({ name: "?age", value: 30 }),
        ],
      })
    );
  });

  it("should handle different SPARQL data types", async () => {
    const mockResponse = {
      head: { vars: ["string", "integer", "boolean", "date", "uri"] },
      results: {
        bindings: [
          {
            string: { type: "literal", value: "hello" },
            integer: {
              type: "literal",
              datatype: "http://www.w3.org/2001/XMLSchema#integer",
              value: "42",
            },
            boolean: {
              type: "literal",
              datatype: "http://www.w3.org/2001/XMLSchema#boolean",
              value: "true",
            },
            date: {
              type: "literal",
              datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
              value: "2023-01-01T00:00:00Z",
            },
            uri: { type: "uri", value: "http://example.org/resource" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "SELECT * WHERE { ?s ?p ?o }",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      createResultBundle({
        values: [
          createResultScalar({ name: "?string", value: "hello" }),
          createResultScalar({ name: "?integer", value: 42 }),
          createResultScalar({ name: "?boolean", value: true }),
          createResultScalar({
            name: "?date",
            value: new Date("2023-01-01T00:00:00Z"),
          }),
          createResultScalar({
            name: "?uri",
            value: "http://example.org/resource",
          }),
        ],
      })
    );
  });

  it("should handle empty results", async () => {
    const mockResponse = {
      head: { vars: ["name"] },
      results: {
        bindings: [],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "SELECT ?name WHERE { ?s ?p ?name }",
    });

    expect(result).toEqual([]);
  });

  it("should throw error for invalid SPARQL response", async () => {
    const mockResponse = { invalid: "response" };
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(
      rawQuery(mockFetch, { query: "SELECT ?name WHERE { ?s ?p ?name }" })
    ).rejects.toThrow();
  });

  it("should throw error when fetch returns error response", async () => {
    const mockErrorResponse = {
      code: "SPARQL_ERROR",
      detailedMessage: "Invalid query syntax",
    };
    const mockFetch = vi.fn().mockResolvedValue(mockErrorResponse);

    await expect(
      rawQuery(mockFetch, { query: "INVALID QUERY" })
    ).rejects.toThrow("Invalid query syntax");
  });

  it("should handle CONSTRUCT query results by creating vertex objects", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "John Doe" },
          },
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/age" },
            object: {
              type: "literal",
              datatype: "http://www.w3.org/2001/XMLSchema#integer",
              value: "30",
            },
          },
          {
            subject: { type: "uri", value: "http://example.org/person2" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "Jane Smith" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    });

    expect(result).toHaveLength(2);

    // First person vertex (fragment without attributes)
    expect(result[0]).toEqual(
      createResultVertex({
        id: "http://example.org/person1",
        types: [],
        isBlankNode: false,
      })
    );

    // Second person vertex (fragment without attributes)
    expect(result[1]).toEqual(
      createResultVertex({
        id: "http://example.org/person2",
        types: [],
        isBlankNode: false,
      })
    );
  });

  it("should handle CONSTRUCT query with single triple", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          {
            subject: { type: "uri", value: "http://example.org/resource" },
            predicate: { type: "uri", value: "http://example.org/title" },
            object: { type: "literal", value: "Example Resource" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query:
        "CONSTRUCT { ?s <http://example.org/title> ?title } WHERE { ?s <http://example.org/title> ?title }",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      createResultVertex({
        id: "http://example.org/resource",
        types: [],
        isBlankNode: false,
      })
    );
  });

  it("should handle CONSTRUCT query with empty results", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    });

    expect(result).toEqual([]);
  });

  it("should handle CONSTRUCT query with rdf:type predicates", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: {
              type: "uri",
              value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            object: { type: "uri", value: "http://example.org/Person" },
          },
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: {
              type: "uri",
              value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            object: { type: "uri", value: "http://example.org/Employee" },
          },
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "John Doe" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      createResultVertex({
        id: "http://example.org/person1",
        isBlankNode: false,
      })
    );
  });

  it("should not treat SELECT queries with subject/predicate/object variables as CONSTRUCT", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object", "extra"] },
      results: {
        bindings: [
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "John Doe" },
            extra: { type: "literal", value: "additional data" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query:
        "SELECT ?subject ?predicate ?object ?extra WHERE { ?subject ?predicate ?object . ?subject ?extra ?value }",
    });

    // Should be treated as SELECT query (bundle with 4 scalars), not CONSTRUCT
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      createResultBundle({
        values: [
          createResultScalar({
            name: "?subject",
            value: "http://example.org/person1",
          }),
          createResultScalar({
            name: "?predicate",
            value: "http://example.org/name",
          }),
          createResultScalar({ name: "?object", value: "John Doe" }),
          createResultScalar({ name: "?extra", value: "additional data" }),
        ],
      })
    );
  });

  it("should not treat SELECT queries with non-URI subjects as CONSTRUCT", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          {
            subject: { type: "literal", value: "not a uri" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "John Doe" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query:
        "SELECT ?subject ?predicate ?object WHERE { ?subject ?predicate ?object }",
    });

    // Should be treated as SELECT query (bundle with 3 scalars), not CONSTRUCT
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      createResultBundle({
        values: [
          createResultScalar({
            name: "?subject",
            value: "not a uri",
          }),
          createResultScalar({
            name: "?predicate",
            value: "http://example.org/name",
          }),
          createResultScalar({ name: "?object", value: "John Doe" }),
        ],
      })
    );
  });

  it("should handle CONSTRUCT query with edges (URI subject and object)", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/knows" },
            object: { type: "uri", value: "http://example.org/person2" },
          },
          {
            subject: { type: "uri", value: "http://example.org/person2" },
            predicate: { type: "uri", value: "http://example.org/worksAt" },
            object: { type: "uri", value: "http://example.org/company1" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    });

    expect(result).toHaveLength(2);

    // First edge
    expect(result[0]).toEqual(
      createResultEdge({
        id: "http://example.org/person1-[http://example.org/knows]->http://example.org/person2",
        sourceId: "http://example.org/person1",
        targetId: "http://example.org/person2",
        type: "http://example.org/knows",
        attributes: {},
      })
    );

    // Second edge
    expect(result[1]).toEqual(
      createResultEdge({
        id: "http://example.org/person2-[http://example.org/worksAt]->http://example.org/company1",
        sourceId: "http://example.org/person2",
        targetId: "http://example.org/company1",
        type: "http://example.org/worksAt",
        attributes: {},
      })
    );
  });

  it("should handle CONSTRUCT query with mixed edges and vertex attributes", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          // Edge: person1 knows person2
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/knows" },
            object: { type: "uri", value: "http://example.org/person2" },
          },
          // Vertex attribute: person1 has name "John"
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "John" },
          },
          // Vertex attribute: person2 has name "Jane"
          {
            subject: { type: "uri", value: "http://example.org/person2" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "Jane" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    });

    expect(result).toHaveLength(3);

    // Edge result
    expect(result[0]).toEqual(
      createResultEdge({
        id: "http://example.org/person1-[http://example.org/knows]->http://example.org/person2",
        sourceId: "http://example.org/person1",
        targetId: "http://example.org/person2",
        type: "http://example.org/knows",
        attributes: {},
      })
    );

    // Vertex results (fragments without attributes)
    expect(result[1]).toEqual(
      createResultVertex({
        id: "http://example.org/person1",
        types: [],
        isBlankNode: false,
      })
    );

    expect(result[2]).toEqual(
      createResultVertex({
        id: "http://example.org/person2",
        types: [],
        isBlankNode: false,
      })
    );
  });

  it("should ensure vertex results are only added once even with multiple triples for same subject", async () => {
    const mockResponse = {
      head: { vars: ["subject", "predicate", "object"] },
      results: {
        bindings: [
          // Multiple triples for the same subject (person1)
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "John Doe" },
          },
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/age" },
            object: {
              type: "literal",
              datatype: "http://www.w3.org/2001/XMLSchema#integer",
              value: "30",
            },
          },
          {
            subject: { type: "uri", value: "http://example.org/person1" },
            predicate: { type: "uri", value: "http://example.org/email" },
            object: { type: "literal", value: "john@example.com" },
          },
          // Another subject with multiple triples
          {
            subject: { type: "uri", value: "http://example.org/person2" },
            predicate: { type: "uri", value: "http://example.org/name" },
            object: { type: "literal", value: "Jane Smith" },
          },
          {
            subject: { type: "uri", value: "http://example.org/person2" },
            predicate: { type: "uri", value: "http://example.org/department" },
            object: { type: "literal", value: "Engineering" },
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
    });

    // Should only have 2 vertex results, one for each unique subject URI
    expect(result).toHaveLength(2);

    // First vertex (person1) - should appear only once despite multiple triples
    expect(result[0]).toEqual(
      createResultVertex({
        id: "http://example.org/person1",
        isBlankNode: false,
      })
    );

    // Second vertex (person2) - should appear only once despite multiple triples
    expect(result[1]).toEqual(
      createResultVertex({
        id: "http://example.org/person2",
        isBlankNode: false,
      })
    );

    // Verify no duplicate vertices exist in the result set
    const vertexIds = result
      .filter(item => item.entityType === "vertex")
      .map(vertex => vertex.id);
    const uniqueVertexIds = new Set(vertexIds);
    expect(vertexIds.length).toBe(uniqueVertexIds.size);
  });
});
