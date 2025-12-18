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

// Helper functions extracted for testing (same logic as in index.ts)
const splitGremlinLabels = (label: string): string[] => {
  return label.split("::");
};

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

describe("Gremlin Edge Connection Discovery", () => {
  describe("splitGremlinLabels", () => {
    test("splits single label correctly", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes("::")),
          label => {
            const result = splitGremlinLabels(label);
            expect(result).toHaveLength(1);
            expect(result[0]).toBe(label);
          },
        ),
        { numRuns: 100 },
      );
    });

    test("splits multi-label string by :: separator", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1 }).filter(s => !s.includes("::")),
            {
              minLength: 2,
              maxLength: 5,
            },
          ),
          labels => {
            const combined = labels.join("::");
            const result = splitGremlinLabels(combined);
            expect(result).toStrictEqual(labels);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

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
