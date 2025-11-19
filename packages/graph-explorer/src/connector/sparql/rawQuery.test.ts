import { describe, it, expect, vi } from "vitest";
import { rawQuery } from "./rawquery";
import {
  createResultScalar,
  createResultBundle,
  createResultVertex,
} from "@/connector/entities";
import {
  createUriValue,
  createLiteralValue,
  createTestableVertex,
  createTestableEdge,
  createQuadSparqlResponse,
  createQuadBindingsForEntities,
} from "@/utils/testing";
import {
  createRandomName,
  createRandomInteger,
  createRandomUrlString,
  createRandomBoolean,
  createRandomDate,
} from "@shared/utils/testing";

describe("rawQuery", () => {
  it("should return empty array for empty query", async () => {
    const mockFetch = vi.fn();
    const result = await rawQuery(mockFetch, { query: "" });
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should parse SPARQL response with single variable", async () => {
    const name1 = createRandomName("Person");
    const name2 = createRandomName("Person");

    const mockResponse = {
      head: { vars: ["name"] },
      results: {
        bindings: [
          { name: createLiteralValue(name1) },
          { name: createLiteralValue(name2) },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "SELECT ?name WHERE { ?s ?p ?name }",
    });

    expect(result).toStrictEqual([
      createResultScalar({ name: "?name", value: name1 }),
      createResultScalar({ name: "?name", value: name2 }),
    ]);
  });

  it("should parse SPARQL response with multiple variables as bundles", async () => {
    const personName = createRandomName("Person");
    const personAge = createRandomInteger({ min: 18, max: 80 });

    const mockResponse = {
      head: { vars: ["name", "age"] },
      results: {
        bindings: [
          {
            name: createLiteralValue(personName),
            age: createLiteralValue(personAge),
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "SELECT ?name ?age WHERE { ?s ?p ?name, ?age }",
    });

    expect(result).toStrictEqual([
      createResultBundle({
        values: [
          createResultScalar({ name: "?name", value: personName }),
          createResultScalar({ name: "?age", value: personAge }),
        ],
      }),
    ]);
  });

  it("should handle different SPARQL data types", async () => {
    const stringValue = createRandomName("TestString");
    const integerValue = createRandomInteger();
    const booleanValue = createRandomBoolean();
    const dateValue = createRandomDate();
    const uriValue = createRandomUrlString();

    const mockResponse = {
      head: { vars: ["string", "integer", "boolean", "date", "uri"] },
      results: {
        bindings: [
          {
            string: createLiteralValue(stringValue),
            integer: createLiteralValue(integerValue),
            boolean: createLiteralValue(booleanValue),
            date: createLiteralValue(dateValue),
            uri: createUriValue(uriValue),
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    const result = await rawQuery(mockFetch, {
      query: "SELECT * WHERE { ?s ?p ?o }",
    });

    expect(result).toStrictEqual([
      createResultBundle({
        values: [
          createResultScalar({ name: "?string", value: stringValue }),
          createResultScalar({ name: "?integer", value: integerValue }),
          createResultScalar({ name: "?boolean", value: booleanValue }),
          createResultScalar({ name: "?date", value: dateValue }),
          createResultScalar({ name: "?uri", value: uriValue }),
        ],
      }),
    ]);
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
      rawQuery(mockFetch, { query: "SELECT ?name WHERE { ?s ?p ?name }" }),
    ).rejects.toThrow();
  });

  it("should throw error when fetch returns error response", async () => {
    const mockErrorResponse = {
      code: "SPARQL_ERROR",
      detailedMessage: "Invalid query syntax",
    };
    const mockFetch = vi.fn().mockResolvedValue(mockErrorResponse);

    await expect(
      rawQuery(mockFetch, { query: "INVALID QUERY" }),
    ).rejects.toThrow("Invalid query syntax");
  });

  describe("CONSTRUCT/DESCRIBE queries", () => {
    it("should handle CONSTRUCT query results by creating vertex results", async () => {
      const vertex1 = createTestableVertex().withRdfValues();
      const vertex2 = createTestableVertex().withRdfValues();

      const bindings = createQuadBindingsForEntities([vertex1, vertex2], []);
      const mockResponse = createQuadSparqlResponse(bindings);

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      });

      expect(result).toStrictEqual([
        vertex1.asFragmentResult(),
        vertex2.asFragmentResult(),
      ]);
    });

    it("should handle CONSTRUCT query with single triple", async () => {
      const mockResponse = createQuadSparqlResponse([
        {
          subject: createUriValue("http://example.org/resource"),
          predicate: createUriValue("http://example.org/title"),
          object: createLiteralValue("Example Resource"),
        },
      ]);

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query:
          "CONSTRUCT { ?s <http://example.org/title> ?title } WHERE { ?s <http://example.org/title> ?title }",
      });

      expect(result).toStrictEqual([
        createResultVertex({ id: "http://example.org/resource" }),
      ]);
    });

    it("should handle CONSTRUCT query with empty results", async () => {
      const mockResponse = createQuadSparqlResponse([]);

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      });

      expect(result).toEqual([]);
    });

    it("should not treat SELECT queries with subject/predicate/object variables as CONSTRUCT", async () => {
      const mockResponse = {
        head: { vars: ["subject", "predicate", "object", "extra"] },
        results: {
          bindings: [
            {
              subject: createUriValue("http://example.org/person1"),
              predicate: createUriValue("http://example.org/name"),
              object: createLiteralValue("John Doe"),
              extra: createLiteralValue("additional data"),
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
      expect(result).toStrictEqual([
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
        }),
      ]);
    });

    it("should not treat SELECT queries with non-URI subjects as CONSTRUCT", async () => {
      const mockResponse = {
        head: { vars: ["subject", "predicate", "object"] },
        results: {
          bindings: [
            {
              subject: createLiteralValue("not a uri"),
              predicate: createUriValue("http://example.org/name"),
              object: createLiteralValue("John Doe"),
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
      expect(result).toStrictEqual([
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
        }),
      ]);
    });

    it("should handle CONSTRUCT query with edges (URI subject and object)", async () => {
      const edge1 = createTestableEdge().withRdfValues();
      const edge2 = createTestableEdge().withRdfValues();

      const mockResponse = createQuadSparqlResponse(
        createQuadBindingsForEntities([], [edge1, edge2]),
      );

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      });

      expect(result).toStrictEqual([edge1.asResult(), edge2.asResult()]);
    });

    it("should handle CONSTRUCT query with mixed edges and vertex attributes", async () => {
      const vertex1 = createTestableVertex().withRdfValues();
      const vertex2 = createTestableVertex().withRdfValues();
      const edge = createTestableEdge()
        .withSource(vertex1)
        .withTarget(vertex2)
        .withRdfValues();
      const mockResponse = createQuadSparqlResponse(
        createQuadBindingsForEntities([vertex1, vertex2], [edge]),
      );

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      });

      expect(result).toStrictEqual([
        vertex1.asFragmentResult(),
        vertex2.asFragmentResult(),
        edge.asResult(),
      ]);
    });

    it("should filter out blank nodes from CONSTRUCT query results", async () => {
      const vertex1 = createTestableVertex().withRdfValues({
        isBlankNode: true,
      });
      const vertex2 = createTestableVertex().withRdfValues();
      const vertex3 = createTestableVertex().withRdfValues();
      const edge1 = createTestableEdge()
        .withSource(vertex1)
        .withTarget(vertex2)
        .withRdfValues();
      const edge2 = createTestableEdge()
        .withSource(vertex2)
        .withTarget(vertex1)
        .withRdfValues();
      const edge3 = createTestableEdge()
        .withSource(vertex2)
        .withTarget(vertex3)
        .withRdfValues();

      const mockResponse = createQuadSparqlResponse(
        createQuadBindingsForEntities(
          [vertex1, vertex2, vertex3],
          [edge1, edge2, edge3],
        ),
      );

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      });

      expect(result).toStrictEqual([
        vertex2.asFragmentResult(),
        vertex3.asFragmentResult(),
        edge3.asResult(),
      ]);
    });

    it("should handle CONSTRUCT query with only blank node triples", async () => {
      const vertex = createTestableVertex().withRdfValues({
        isBlankNode: true,
      });
      const edge1 = createTestableEdge().withSource(vertex).withRdfValues();
      const edge2 = createTestableEdge().withTarget(vertex).withRdfValues();

      const mockResponse = createQuadSparqlResponse(
        createQuadBindingsForEntities([vertex], [edge1, edge2]),
      );

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }",
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe("ASK queries", () => {
    it("should handle ASK query with true result", async () => {
      const mockResponse = {
        head: {},
        boolean: true,
      };

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "ASK { ?s ?p ?o }",
      });

      expect(result).toStrictEqual([
        createResultScalar({
          name: "ASK",
          value: true,
        }),
      ]);
    });

    it("should handle ASK query with false result", async () => {
      const mockResponse = {
        head: {},
        boolean: false,
      };

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      const result = await rawQuery(mockFetch, {
        query: "ASK { ?s <http://example.org/nonexistent> ?o }",
      });

      expect(result).toStrictEqual([
        createResultScalar({
          name: "ASK",
          value: false,
        }),
      ]);
    });
  });
});
