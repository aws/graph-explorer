import { parseAndMapQuads } from "./parseAndMapQuads";
import {
  createTestableVertex,
  createTestableEdge,
  createQuadBindingsForEntities,
  createQuadSparqlResponse,
} from "@/utils/testing";
import { createArray } from "@shared/utils/testing";
import { logger } from "@/utils";

describe("parseAndMapQuads", () => {
  describe("error handling", () => {
    it("should throw error when data contains error response", () => {
      const errorData = {
        code: "SPARQL_ERROR",
        detailedMessage: "Invalid SPARQL query syntax",
      };

      expect(() => parseAndMapQuads(errorData)).toThrow(
        "Invalid SPARQL query syntax",
      );
      expect(logger.error).toHaveBeenCalledWith("Invalid SPARQL query syntax");
    });

    it("should throw validation error for invalid SPARQL response structure", () => {
      const invalidData = {
        invalidField: "not a valid SPARQL response",
      };

      expect(() => parseAndMapQuads(invalidData)).toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to parse SPARQL JSON response",
        expect.any(String),
        invalidData,
      );
    });

    it("should throw validation error for missing head field", () => {
      const invalidData = {
        results: {
          bindings: [],
        },
      };

      expect(() => parseAndMapQuads(invalidData)).toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it("should throw validation error for missing results field", () => {
      const invalidData = {
        head: { vars: ["subject", "predicate", "object"] },
      };

      expect(() => parseAndMapQuads(invalidData)).toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it("should throw validation error for invalid binding structure", () => {
      const invalidData = {
        head: { vars: ["subject", "predicate", "object"] },
        results: {
          bindings: [
            {
              subject: { type: "uri", value: "http://example.com/resource" },
              predicate: { type: "uri", value: "http://example.com/predicate" },
              // Missing object field
            },
          ],
        },
      };

      expect(() => parseAndMapQuads(invalidData)).toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it("should throw validation error for invalid subject type", () => {
      const invalidData = {
        head: { vars: ["subject", "predicate", "object"] },
        results: {
          bindings: [
            {
              subject: { type: "literal", value: "invalid subject type" },
              predicate: { type: "uri", value: "http://example.com/predicate" },
              object: { type: "literal", value: "test value" },
            },
          ],
        },
      };

      expect(() => parseAndMapQuads(invalidData)).toThrow();
    });

    it("should throw validation error for invalid predicate type", () => {
      const invalidData = {
        head: { vars: ["subject", "predicate", "object"] },
        results: {
          bindings: [
            {
              subject: { type: "uri", value: "http://example.com/resource" },
              predicate: { type: "literal", value: "invalid predicate type" },
              object: { type: "literal", value: "test value" },
            },
          ],
        },
      };

      expect(() => parseAndMapQuads(invalidData)).toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("successful parsing", () => {
    it("should parse empty SPARQL response", () => {
      const data = createQuadSparqlResponse([]);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: [],
        edges: [],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse single vertex with URI", () => {
      const vertex = createTestableVertex().withRdfValues();
      const bindings = createQuadBindingsForEntities([vertex], []);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: [vertex.asResult()],
        edges: [],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse single vertex with blank node", () => {
      const vertex = createTestableVertex().withRdfValues({
        isBlankNode: true,
      });
      const bindings = createQuadBindingsForEntities([vertex], []);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: [vertex.asResult()],
        edges: [],
      });
      expect(result.vertices[0].isBlankNode).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse multiple vertices", () => {
      const vertices = createArray(3, () =>
        createTestableVertex().withRdfValues(),
      );
      const bindings = createQuadBindingsForEntities(vertices, []);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: vertices.map(v => v.asResult()),
        edges: [],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse single edge", () => {
      const source = createTestableVertex().withRdfValues();
      const target = createTestableVertex().withRdfValues();
      const edge = createTestableEdge()
        .withSource(source)
        .withTarget(target)
        .withRdfValues();

      const bindings = createQuadBindingsForEntities([source, target], [edge]);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: [source.asResult(), target.asResult()],
        edges: [edge.asResult()],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse multiple edges", () => {
      const vertices = createArray(4, () =>
        createTestableVertex().withRdfValues(),
      );
      const edges = [
        createTestableEdge()
          .withSource(vertices[0])
          .withTarget(vertices[1])
          .withRdfValues(),
        createTestableEdge()
          .withSource(vertices[1])
          .withTarget(vertices[2])
          .withRdfValues(),
        createTestableEdge()
          .withSource(vertices[2])
          .withTarget(vertices[3])
          .withRdfValues(),
      ];

      const bindings = createQuadBindingsForEntities(vertices, edges);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: vertices.map(v => v.asResult()),
        edges: edges.map(e => e.asResult()),
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse mixed URI and blank node entities", () => {
      const uriVertex = createTestableVertex().withRdfValues();
      const blankVertex = createTestableVertex().withRdfValues({
        isBlankNode: true,
      });
      const edge = createTestableEdge()
        .withSource(uriVertex)
        .withTarget(blankVertex)
        .withRdfValues();

      const bindings = createQuadBindingsForEntities(
        [uriVertex, blankVertex],
        [edge],
      );
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: [uriVertex.asResult(), blankVertex.asResult()],
        edges: [edge.asResult()],
      });
      expect(result.vertices[0].isBlankNode).toBe(false);
      expect(result.vertices[1].isBlankNode).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse vertices with no attributes", () => {
      const vertex = createTestableVertex().withRdfValues().with({
        attributes: {},
      });

      const bindings = createQuadBindingsForEntities([vertex], []);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: [vertex.asFragmentResult()],
        edges: [],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse vertices with no types", () => {
      const vertex = createTestableVertex().withRdfValues().with({
        types: [],
      });

      const bindings = createQuadBindingsForEntities([vertex], []);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result.vertices).toEqual([vertex.asResult()]);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should handle duplicate bindings correctly", () => {
      const vertex = createTestableVertex().withRdfValues();
      const bindings = createQuadBindingsForEntities([vertex], []);

      // Create duplicate bindings
      const duplicatedBindings = [...bindings, ...bindings];
      const data = createQuadSparqlResponse(duplicatedBindings);

      const result = parseAndMapQuads(data);

      // Should still only have one vertex with merged data
      expect(result.vertices).toStrictEqual([vertex.asResult()]);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("should parse complex graph with multiple entity types", () => {
      const vertices = createArray(5, () =>
        createTestableVertex().withRdfValues(),
      );
      const blankNodes = createArray(2, () =>
        createTestableVertex().withRdfValues({ isBlankNode: true }),
      );
      const edges = [
        createTestableEdge()
          .withSource(vertices[0])
          .withTarget(vertices[1])
          .withRdfValues(),
        createTestableEdge()
          .withSource(vertices[1])
          .withTarget(blankNodes[0])
          .withRdfValues(),
        createTestableEdge()
          .withSource(blankNodes[0])
          .withTarget(blankNodes[1])
          .withRdfValues(),
      ];

      const allVertices = [...vertices, ...blankNodes];
      const bindings = createQuadBindingsForEntities(allVertices, edges);
      const data = createQuadSparqlResponse(bindings);

      const result = parseAndMapQuads(data);

      expect(result.vertices).toHaveLength(7);
      expect(result.edges).toHaveLength(3);
      expect(result.vertices.filter(v => v.isBlankNode)).toHaveLength(2);
      expect(result.vertices.filter(v => !v.isBlankNode)).toHaveLength(5);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle null data", () => {
      expect(() => parseAndMapQuads(null)).toThrow();
    });

    it("should handle undefined data", () => {
      expect(() => parseAndMapQuads(undefined)).toThrow();
    });

    it("should handle string data", () => {
      expect(() => parseAndMapQuads("invalid")).toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle array data", () => {
      expect(() => parseAndMapQuads([])).toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle response with optional graph field", () => {
      const vertex = createTestableVertex().withRdfValues();
      const bindings = createQuadBindingsForEntities([vertex], []);

      // Add graph field to bindings
      const bindingsWithGraph = bindings.map(binding => ({
        ...binding,
        graph: { type: "uri" as const, value: "http://example.com/graph" },
      }));

      const data = createQuadSparqlResponse(bindingsWithGraph);

      const result = parseAndMapQuads(data);

      expect(result).toEqual({
        vertices: [vertex.asResult()],
        edges: [],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
