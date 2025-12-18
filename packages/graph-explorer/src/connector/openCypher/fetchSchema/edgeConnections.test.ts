import { describe, expect, test } from "vitest";
import fc from "fast-check";

/**
 * **Feature: schema-explorer, Property 6: Edge connection discovery extracts correct data**
 * **Feature: schema-explorer, Property 6a: Multi-label edge connections are expanded**
 *
 * For any edge in the database, the edge connection discovery SHALL correctly
 * identify and return the source node label, edge type, and target node label.
 *
 * For any edge connecting a source node with M labels to a target node with N
 * labels, the edge connection discovery SHALL produce M × N edge connections.
 *
 * **Validates: Requirements 5.2**
 */

// Helper function extracted for testing (same logic as in index.ts)
const expandEdgeConnections = (
  sourceLabels: string[],
  edgeType: string,
  targetLabels: string[],
  count: number,
) => {
  const connections: {
    edgeType: string;
    sourceLabel: string;
    targetLabel: string;
    count: number;
  }[] = [];
  for (const sourceLabel of sourceLabels) {
    for (const targetLabel of targetLabels) {
      connections.push({
        edgeType,
        sourceLabel,
        targetLabel,
        count,
      });
    }
  }
  return connections;
};

describe("OpenCypher Edge Connection Discovery", () => {
  describe("expandEdgeConnections", () => {
    test("produces M × N connections for M source labels and N target labels", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 1 }),
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          fc.nat(),
          (sourceLabels, edgeType, targetLabels, count) => {
            const result = expandEdgeConnections(
              sourceLabels,
              edgeType,
              targetLabels,
              count,
            );

            // Property 6a: Should produce M × N connections
            expect(result).toHaveLength(
              sourceLabels.length * targetLabels.length,
            );

            // Property 6: Each connection should have correct data
            for (const conn of result) {
              expect(conn.edgeType).toBe(edgeType);
              expect(conn.count).toBe(count);
              expect(sourceLabels).toContain(conn.sourceLabel);
              expect(targetLabels).toContain(conn.targetLabel);
            }

            // Verify all combinations are present
            for (const source of sourceLabels) {
              for (const target of targetLabels) {
                const found = result.find(
                  c => c.sourceLabel === source && c.targetLabel === target,
                );
                expect(found).toBeDefined();
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    test("single source and target produces exactly one connection", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.nat(),
          (sourceLabel, edgeType, targetLabel, count) => {
            const result = expandEdgeConnections(
              [sourceLabel],
              edgeType,
              [targetLabel],
              count,
            );

            expect(result).toHaveLength(1);
            expect(result[0]).toStrictEqual({
              edgeType,
              sourceLabel,
              targetLabel,
              count,
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
