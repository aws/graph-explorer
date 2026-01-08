import { describe, expect, test } from "vitest";
import fc from "fast-check";
import type { EdgeConnection } from "./types";
import { serializeData, deserializeData } from "../StateProvider/serializeData";

/**
 * **Feature: schema-explorer, Property 8: Edge connection serialization round-trip**
 *
 * For any schema with edge connections, serializing and then deserializing
 * the schema SHALL preserve all edge connection data (source label, edge type,
 * target label, count).
 *
 * **Validates: Requirements 5.4, 5.5**
 */
describe("EdgeConnection", () => {
  // Arbitrary for generating random EdgeConnection objects
  const edgeConnectionArbitrary: fc.Arbitrary<EdgeConnection> = fc.record({
    edgeType: fc.string({ minLength: 1 }),
    sourceLabel: fc.string({ minLength: 1 }),
    targetLabel: fc.string({ minLength: 1 }),
    count: fc.option(fc.nat(), { nil: undefined }),
  });

  test("serialization round-trip preserves edge connection data", () => {
    fc.assert(
      fc.property(edgeConnectionArbitrary, edgeConnection => {
        // Serialize the edge connection
        const serialized = serializeData(edgeConnection);

        // Deserialize it back
        const deserialized = deserializeData(serialized) as EdgeConnection;

        // Verify all fields are preserved
        expect(deserialized.edgeType).toBe(edgeConnection.edgeType);
        expect(deserialized.sourceLabel).toBe(edgeConnection.sourceLabel);
        expect(deserialized.targetLabel).toBe(edgeConnection.targetLabel);
        expect(deserialized.count).toBe(edgeConnection.count);
      }),
      { numRuns: 100 },
    );
  });

  test("serialization round-trip preserves array of edge connections", () => {
    fc.assert(
      fc.property(
        fc.array(edgeConnectionArbitrary, { minLength: 0, maxLength: 20 }),
        edgeConnections => {
          // Serialize the array
          const serialized = serializeData(edgeConnections);

          // Deserialize it back
          const deserialized = deserializeData(serialized) as EdgeConnection[];

          // Verify array length is preserved
          expect(deserialized.length).toBe(edgeConnections.length);

          // Verify each edge connection is preserved
          for (let i = 0; i < edgeConnections.length; i++) {
            expect(deserialized[i].edgeType).toBe(edgeConnections[i].edgeType);
            expect(deserialized[i].sourceLabel).toBe(
              edgeConnections[i].sourceLabel,
            );
            expect(deserialized[i].targetLabel).toBe(
              edgeConnections[i].targetLabel,
            );
            expect(deserialized[i].count).toBe(edgeConnections[i].count);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
