import { describe, expect, test } from "vitest";
import fc from "fast-check";
import { z } from "zod";

/**
 * **Feature: schema-explorer, Property 6: Edge connection discovery extracts correct data**
 *
 * For any edge in the database, the edge connection discovery SHALL correctly
 * identify and return the source node label, edge type, and target node label.
 *
 * **Validates: Requirements 5.2**
 */

// Zod schema for edge connections response (same as in index.ts)
const edgeConnectionsResponseSchema = z.object({
  results: z.object({
    bindings: z.array(
      z.object({
        sourceType: z.object({ type: z.string(), value: z.string() }),
        predicate: z.object({ type: z.string(), value: z.string() }),
        targetType: z.object({ type: z.string(), value: z.string() }),
        count: z.object({
          type: z.string(),
          value: z.string(),
          datatype: z.string().optional(),
        }),
      }),
    ),
  }),
});

// Helper function to transform parsed response to EdgeConnection array (same logic as in index.ts)
const transformToEdgeConnections = (
  parsed: z.infer<typeof edgeConnectionsResponseSchema>,
) => {
  return parsed.results.bindings.map(binding => ({
    edgeType: binding.predicate.value,
    sourceLabel: binding.sourceType.value,
    targetLabel: binding.targetType.value,
    count: Number(binding.count.value),
  }));
};

describe("SPARQL Edge Connection Discovery", () => {
  // Arbitrary for generating valid SPARQL response bindings
  const sparqlBindingArbitrary = fc.record({
    sourceType: fc.record({
      type: fc.constant("uri"),
      value: fc.webUrl(),
    }),
    predicate: fc.record({
      type: fc.constant("uri"),
      value: fc.webUrl(),
    }),
    targetType: fc.record({
      type: fc.constant("uri"),
      value: fc.webUrl(),
    }),
    count: fc.record({
      type: fc.constant("literal"),
      value: fc.nat().map(String),
      datatype: fc.constant("http://www.w3.org/2001/XMLSchema#integer"),
    }),
  });

  const sparqlResponseArbitrary = fc
    .array(sparqlBindingArbitrary, { minLength: 0, maxLength: 10 })
    .map(bindings => ({
      results: { bindings },
    }));

  test("correctly extracts edge connection data from SPARQL response", () => {
    fc.assert(
      fc.property(sparqlResponseArbitrary, response => {
        const parsed = edgeConnectionsResponseSchema.parse(response);
        const edgeConnections = transformToEdgeConnections(parsed);

        // Property 6: Each binding should produce exactly one edge connection
        expect(edgeConnections).toHaveLength(response.results.bindings.length);

        // Verify each edge connection has correct data
        for (let i = 0; i < edgeConnections.length; i++) {
          const conn = edgeConnections[i];
          const binding = response.results.bindings[i];

          expect(conn.edgeType).toBe(binding.predicate.value);
          expect(conn.sourceLabel).toBe(binding.sourceType.value);
          expect(conn.targetLabel).toBe(binding.targetType.value);
          expect(conn.count).toBe(Number(binding.count.value));
        }
      }),
      { numRuns: 100 },
    );
  });

  test("handles empty bindings array", () => {
    const emptyResponse = { results: { bindings: [] } };
    const parsed = edgeConnectionsResponseSchema.parse(emptyResponse);
    const edgeConnections = transformToEdgeConnections(parsed);

    expect(edgeConnections).toHaveLength(0);
  });
});
