import type { EdgeType, VertexType } from "@/core/entities";
import type {
  EdgeStyleStorage,
  VertexStyleStorage,
} from "@/core/StateProvider/graphStyles";
import type { StylingParseResult } from "@/core/styling";

import { createEdgeType, createVertexType } from "@/core/entities";
import {
  appDefaultVertexStyle,
  resolveConditionalEdgeStyle,
  resolveConditionalVertexStyle,
  resolveEdgeStyle,
  resolveVertexStyle,
} from "@/core/StateProvider/graphStyles";

import { buildStyleImportPlan } from "./styleImportPlan";

function parseResult(
  vertexStyles: Map<VertexType, VertexStyleStorage> = new Map(),
  edgeStyles: Map<EdgeType, EdgeStyleStorage> = new Map(),
): StylingParseResult {
  return { vertexStyles, edgeStyles };
}

describe("buildStyleImportPlan", () => {
  test("classifies a type with no current style as new", () => {
    const type = createVertexType("Airport");
    const incoming: VertexStyleStorage = { type, color: "#abc" };

    const plan = buildStyleImportPlan(
      parseResult(new Map([[type, incoming]])),
      new Map(),
      new Map(),
    );

    expect(plan.items).toStrictEqual([
      {
        kind: "vertex",
        variant: "base",
        type,
        status: "new",
        incoming,
        incomingStyle: resolveVertexStyle(type, incoming),
        currentStyle: resolveVertexStyle(type),
      },
    ]);
    expect(plan.skippedCount).toBe(0);
  });

  test("classifies a type that already has a user style as existing", () => {
    const type = createVertexType("Airport");
    const current: VertexStyleStorage = { type, color: "#111" };
    const incoming: VertexStyleStorage = { type, color: "#abc" };

    const plan = buildStyleImportPlan(
      parseResult(new Map([[type, incoming]])),
      new Map([[type, current]]),
      new Map(),
    );

    expect(plan.items).toStrictEqual([
      {
        kind: "vertex",
        variant: "base",
        type,
        status: "existing",
        incoming,
        incomingStyle: resolveVertexStyle(type, incoming),
        currentStyle: resolveVertexStyle(type, current),
      },
    ]);
  });

  test("excludes a type whose incoming style resolves identically to the current style", () => {
    const type = createVertexType("Airport");
    // Storage differs (explicit default vs. omitted) but they resolve the same.
    const current: VertexStyleStorage = {
      type,
      color: appDefaultVertexStyle.color,
    };
    const incoming: VertexStyleStorage = { type };

    const plan = buildStyleImportPlan(
      parseResult(new Map([[type, incoming]])),
      new Map([[type, current]]),
      new Map(),
    );

    expect(plan.items).toStrictEqual([]);
    expect(plan.skippedCount).toBe(1);
  });

  test("keeps actionable types while counting the identical ones as skipped", () => {
    const changed = createVertexType("Airport");
    const unchanged = createVertexType("Country");
    const changedIncoming: VertexStyleStorage = {
      type: changed,
      color: "#abc",
    };

    const plan = buildStyleImportPlan(
      parseResult(
        new Map([
          [changed, changedIncoming],
          // Resolves identically to the current style, so it is skipped.
          [unchanged, { type: unchanged, color: appDefaultVertexStyle.color }],
        ]),
      ),
      new Map([[unchanged, { type: unchanged }]]),
      new Map(),
    );

    expect(plan.items).toStrictEqual([
      {
        kind: "vertex",
        variant: "base",
        type: changed,
        status: "new",
        incoming: changedIncoming,
        incomingStyle: resolveVertexStyle(changed, changedIncoming),
        currentStyle: resolveVertexStyle(changed),
      },
    ]);
    expect(plan.skippedCount).toBe(1);
  });

  test("splits a type with a conditional style into base and conditional items", () => {
    const type = createVertexType("Person");
    const condition = {
      attribute: "known_bad",
      operator: "=",
      value: "true",
    } as const;
    const base: VertexStyleStorage = { type, color: "#abc" };
    const incoming: VertexStyleStorage = {
      ...base,
      conditionalStyle: { condition, color: "#f00" },
    };

    const plan = buildStyleImportPlan(
      parseResult(new Map([[type, incoming]])),
      new Map(),
      new Map(),
    );

    expect(plan.items).toStrictEqual([
      {
        kind: "vertex",
        variant: "base",
        type,
        status: "new",
        incoming: base,
        incomingStyle: resolveVertexStyle(type, base),
        currentStyle: resolveVertexStyle(type),
      },
      {
        kind: "vertex",
        variant: "conditional",
        type,
        status: "new",
        condition,
        incoming,
        incomingStyle: resolveConditionalVertexStyle(
          resolveVertexStyle(type, incoming),
        )!.style,
        currentStyle: resolveVertexStyle(type, base),
      },
    ]);
    expect(plan.skippedCount).toBe(0);
  });

  test("includes edge styles alongside vertex styles", () => {
    const edgeType = createEdgeType("route");
    const incoming: EdgeStyleStorage = { type: edgeType, lineColor: "#def" };

    const plan = buildStyleImportPlan(
      parseResult(new Map(), new Map([[edgeType, incoming]])),
      new Map(),
      new Map(),
    );

    expect(plan.items).toStrictEqual([
      {
        kind: "edge",
        variant: "base",
        type: edgeType,
        status: "new",
        incoming,
        incomingStyle: resolveEdgeStyle(edgeType, incoming),
        currentStyle: resolveEdgeStyle(edgeType),
      },
    ]);
  });

  test("splits an edge type with a conditional style into base and conditional items", () => {
    const type = createEdgeType("route");
    const condition = {
      attribute: "weight",
      operator: ">",
      value: "10",
    } as const;
    const base: EdgeStyleStorage = { type, lineColor: "#def" };
    const incoming: EdgeStyleStorage = {
      ...base,
      conditionalStyle: { condition, lineColor: "#f00" },
    };

    const plan = buildStyleImportPlan(
      parseResult(new Map(), new Map([[type, incoming]])),
      new Map(),
      new Map(),
    );

    expect(plan.items).toStrictEqual([
      {
        kind: "edge",
        variant: "base",
        type,
        status: "new",
        incoming: base,
        incomingStyle: resolveEdgeStyle(type, base),
        currentStyle: resolveEdgeStyle(type),
      },
      {
        kind: "edge",
        variant: "conditional",
        type,
        status: "new",
        condition,
        incoming,
        incomingStyle: resolveConditionalEdgeStyle(
          resolveEdgeStyle(type, incoming),
        )!.style,
        currentStyle: resolveEdgeStyle(type, base),
      },
    ]);
    expect(plan.skippedCount).toBe(0);
  });

  test("emits only the conditional item when the base matches but the condition is new", () => {
    const type = createVertexType("Person");
    const condition = {
      attribute: "known_bad",
      operator: "=",
      value: "true",
    } as const;
    const current: VertexStyleStorage = { type, color: "#abc" };
    // Same base color as current, so the base item is a no-op; only the
    // condition is new.
    const incoming: VertexStyleStorage = {
      ...current,
      conditionalStyle: { condition, color: "#f00" },
    };

    const plan = buildStyleImportPlan(
      parseResult(new Map([[type, incoming]])),
      new Map([[type, current]]),
      new Map(),
    );

    expect(plan.items).toStrictEqual([
      {
        kind: "vertex",
        variant: "conditional",
        type,
        status: "new",
        condition,
        incoming,
        incomingStyle: resolveConditionalVertexStyle(
          resolveVertexStyle(type, incoming),
        )!.style,
        currentStyle: resolveVertexStyle(type, current),
      },
    ]);
    expect(plan.skippedCount).toBe(0);
  });

  test("skips a type whose base and conditional both match the current style", () => {
    const type = createVertexType("Person");
    const condition = {
      attribute: "known_bad",
      operator: "=",
      value: "true",
    } as const;
    const style: VertexStyleStorage = {
      type,
      color: "#abc",
      conditionalStyle: { condition, color: "#f00" },
    };

    const plan = buildStyleImportPlan(
      parseResult(new Map([[type, style]])),
      new Map([[type, style]]),
      new Map(),
    );

    expect(plan.items).toStrictEqual([]);
    expect(plan.skippedCount).toBe(1);
  });
});
