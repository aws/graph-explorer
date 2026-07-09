// @vitest-environment happy-dom
import cytoscape from "cytoscape";

import type { StyleCondition } from "@/core/StateProvider/graphStyles";

import { getStyles } from "@/components/Graph/hooks/useManageStyles";
import { createVertexType, useRenderedEntities, type VertexId } from "@/core";
import {
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import useGraphStyles from "./useGraphStyles";

vi.mock("./renderNode", () => ({
  renderNode: vi.fn().mockResolvedValue(null),
}));

const BASE_COLOR = "rgb(123,31,162)"; // #7B1FA2
const CONDITIONAL_COLOR = "rgb(236,17,17)"; // #EC1111

/**
 * Drives the full conditional-styling pipeline — condition evaluation in
 * `useRenderedEntities`, selector generation in `useGraphStyles`, and the
 * stylesheet from `getStyles` — through a real headless Cytoscape, returning
 * the resolved background color of the matching and non-matching node.
 */
function backgroundColors(
  condition: StyleCondition,
  matchingValue: unknown,
  nonMatchingValue: unknown,
) {
  const dbState = new DbState();
  const type = createVertexType("Person");

  const matching = createTestableVertex().with({
    types: [type],
    attributes: { [condition.attribute]: matchingValue as never },
  });
  const nonMatching = createTestableVertex().with({
    types: [type],
    attributes: { [condition.attribute]: nonMatchingValue as never },
  });
  dbState.addTestableVertexToGraph(matching);
  dbState.addTestableVertexToGraph(nonMatching);
  dbState.addVertexStyle(type, {
    color: "#7B1FA2",
    conditionalStyle: { condition, color: "#EC1111" },
  });

  const { result } = renderHookWithState(
    () => ({ styles: useGraphStyles(), entities: useRenderedEntities() }),
    dbState,
  );

  const { styles, entities } = result.current;
  const cy = cytoscape({
    headless: true,
    styleEnabled: true,
    elements: entities.vertices.map(v => ({ data: v.data })),
    style: getStyles({ styles, layout: "FORCE" }),
  });

  const colorFor = (rawId: VertexId) => {
    const node = entities.vertices.find(v => v.data.vertexId === rawId);
    return cy.getElementById(String(node!.data.id)).style("background-color");
  };

  return {
    matching: colorFor(matching.id),
    nonMatching: colorFor(nonMatching.id),
  };
}

describe("conditional styling applies only to matching entities", () => {
  it("numeric comparison", () => {
    const colors = backgroundColors(
      { attribute: "score", operator: ">", value: "50" },
      90,
      10,
    );
    expect(colors).toStrictEqual({
      matching: CONDITIONAL_COLOR,
      nonMatching: BASE_COLOR,
    });
  });

  it("ISO date comparison", () => {
    const colors = backgroundColors(
      { attribute: "create_date", operator: ">", value: "2025-03-03" },
      "2026-01-01",
      "2024-01-01",
    );
    expect(colors).toStrictEqual({
      matching: CONDITIONAL_COLOR,
      nonMatching: BASE_COLOR,
    });
  });

  it("non-ISO (M/D/YYYY) date comparison — the reported bug", () => {
    // Lexicographically "6/1/2024" > "2025-03-03", so the old Cytoscape-native
    // comparison styled BOTH nodes. Chronologically 6/1/2024 is before the
    // threshold and must keep the base color.
    const colors = backgroundColors(
      { attribute: "create_date", operator: ">", value: "2025-03-03" },
      "6/1/2026",
      "6/1/2024",
    );
    expect(colors).toStrictEqual({
      matching: CONDITIONAL_COLOR,
      nonMatching: BASE_COLOR,
    });
  });

  it("boolean equality", () => {
    const colors = backgroundColors(
      { attribute: "known_bad", operator: "=", value: "true" },
      true,
      false,
    );
    expect(colors).toStrictEqual({
      matching: CONDITIONAL_COLOR,
      nonMatching: BASE_COLOR,
    });
  });
});
