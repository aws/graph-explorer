import type { EdgeType, VertexType } from "@/core/entities";
import type {
  EdgeStyleStorage,
  VertexStyleStorage,
} from "@/core/StateProvider/graphStyles";
import type { StylingParseResult } from "@/core/styling";

import { createEdgeType, createVertexType } from "@/core/entities";
import {
  appDefaultVertexStyle,
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
        type,
        status: "new",
        incoming,
        incomingStyle: resolveVertexStyle(type, incoming),
        currentStyle: resolveVertexStyle(type),
      },
    ]);
    expect(plan.skippedCount).toBe(0);
  });

  test("classifies a type that already has a user style as a conflict", () => {
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
        type,
        status: "conflict",
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
        type: edgeType,
        status: "new",
        incoming,
        incomingStyle: resolveEdgeStyle(edgeType, incoming),
        currentStyle: resolveEdgeStyle(edgeType),
      },
    ]);
  });
});
