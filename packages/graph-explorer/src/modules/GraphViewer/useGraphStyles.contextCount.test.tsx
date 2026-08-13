// @vitest-environment happy-dom
import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createEdgeType, createVertexType } from "@/core";
import {
  createRandomEdgeTypeConfig,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import useGraphStyles from "./useGraphStyles";

// Style-context count is what makes cytoscape style application O(elements × contexts).
// If this drifts to O(vertex-type + edge-type count), the schema view locks up at ~10k
// labels — see #2104. Assertion is O(1) selector count regardless of type count.

function seedWithTypes(n: number) {
  const dbState = new DbState();
  const vertices = Array.from({ length: n }, (_, i) => ({
    ...createRandomVertexTypeConfig(),
    type: createVertexType(`vt${i}`),
  }));
  const edges = Array.from({ length: n }, (_, i) => ({
    ...createRandomEdgeTypeConfig(),
    type: createEdgeType(`et${i}`),
  }));
  dbState.activeSchema.vertices = vertices;
  dbState.activeSchema.edges = edges;
  for (const v of vertices) dbState.addVertexStyle(v.type, v);
  for (const e of edges) dbState.addEdgeStyle(e.type, e);
  return dbState;
}

async function selectorCountFor(n: number): Promise<number> {
  const { result } = renderHookWithState(
    () => useGraphStyles(),
    seedWithTypes(n),
  );
  await waitFor(() => expect(result.current).toBeDefined());
  return Object.keys(result.current).length;
}

describe("useGraphStyles style-context count", () => {
  it("stays O(1) regardless of vertex/edge type count", async () => {
    const small = await selectorCountFor(2);
    const large = await selectorCountFor(50);
    expect(large).toBe(small);
  });

  it("emits a small fixed number of selectors, not per-type", async () => {
    const count = await selectorCountFor(50);
    // node rule + edge rule + at most a couple of gated rules
    expect(count).toBeLessThanOrEqual(6);
  });
});
