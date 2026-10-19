// @vitest-environment happy-dom

import { describe, expect, test } from "vite-plus/test";

import type { VertexType } from "@/core/entities";
import type {
  EdgeStyleStorage,
  VertexStyleStorage,
} from "@/core/StateProvider/graphStyles";

import { getAppStore } from "@/core";
import { createEdgeType, createVertexType } from "@/core/entities";
import {
  resolveEdgeStyle,
  resolveVertexStyle,
} from "@/core/StateProvider/graphStyles";
import {
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";
import { renderHookWithJotai } from "@/utils/testing";

import type { StyleImportItem } from "./styleImportPlan";

import { useApplyStyleImport } from "./useApplyStyleImport";

function vertexItem(
  type: VertexType,
  incoming: VertexStyleStorage,
): StyleImportItem {
  return {
    kind: "vertex",
    type,
    status: "new",
    incoming,
    incomingStyle: resolveVertexStyle(type, incoming),
    currentStyle: resolveVertexStyle(type),
  };
}

describe("useApplyStyleImport", () => {
  // The read-time transform only runs when the atom is seeded from storage, so
  // without normalizing here an imported blank color would render as no color
  // until the page reloaded.
  test("normalizes an imported style that carries a blank color", () => {
    const vertexType = createVertexType("Airport");
    const { result } = renderHookWithJotai(() => useApplyStyleImport());

    result.current([vertexItem(vertexType, { type: vertexType, color: "" })]);

    const store = getAppStore();
    expect(store.get(userVertexStylesAtom).get(vertexType)).toStrictEqual({
      type: vertexType,
    });
    expect(resolveVertexStyle(vertexType, undefined).color).toBe(
      resolveVertexStyle(
        vertexType,
        store.get(userVertexStylesAtom).get(vertexType),
      ).color,
    );
  });

  // Edges get the same normalization, so an imported value that is not a color
  // never reaches the stored styles.
  test("drops an imported edge color that is not a color", () => {
    const edgeType = createEdgeType("route");
    const incoming: EdgeStyleStorage = {
      type: edgeType,
      lineColor: "var(--x)",
      lineThickness: 3,
    };
    const { result } = renderHookWithJotai(() => useApplyStyleImport());

    result.current([
      {
        kind: "edge",
        type: edgeType,
        status: "new",
        incoming,
        incomingStyle: resolveEdgeStyle(edgeType, incoming),
        currentStyle: resolveEdgeStyle(edgeType),
      },
    ]);

    expect(getAppStore().get(userEdgeStylesAtom).get(edgeType)).toStrictEqual({
      type: edgeType,
      lineThickness: 3,
    });
  });

  test("writes selected vertex and edge styles to the user atoms", () => {
    const vertexType = createVertexType("Airport");
    const edgeType = createEdgeType("route");
    const vertexIncoming: VertexStyleStorage = {
      type: vertexType,
      color: "#abc",
    };
    const edgeIncoming: EdgeStyleStorage = {
      type: edgeType,
      lineColor: "#def",
    };

    const { result } = renderHookWithJotai(() => useApplyStyleImport());

    result.current([
      vertexItem(vertexType, vertexIncoming),
      {
        kind: "edge",
        type: edgeType,
        status: "new",
        incoming: edgeIncoming,
        incomingStyle: resolveEdgeStyle(edgeType, edgeIncoming),
        currentStyle: resolveEdgeStyle(edgeType),
      },
    ]);

    const store = getAppStore();
    expect(store.get(userVertexStylesAtom).get(vertexType)).toStrictEqual(
      vertexIncoming,
    );
    expect(store.get(userEdgeStylesAtom).get(edgeType)).toStrictEqual(
      edgeIncoming,
    );
  });

  test("replaces an existing user style wholesale", () => {
    const type = createVertexType("Airport");
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexStyleStorage>([
        [type, { type, color: "#AA0000", shape: "star" }],
      ]),
    );

    const { result } = renderHookWithJotai(() => useApplyStyleImport());
    result.current([vertexItem(type, { type, color: "#00BB00" })]);

    // Full-type replacement: the old `shape` is gone, not merged.
    expect(store.get(userVertexStylesAtom).get(type)).toStrictEqual({
      type,
      color: "#00BB00",
    });
  });

  test("leaves unselected types untouched", () => {
    const kept = createVertexType("Country");
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexStyleStorage>([
        [kept, { type: kept, color: "#0000CC" }],
      ]),
    );

    const added = createVertexType("Airport");
    const { result } = renderHookWithJotai(() => useApplyStyleImport());
    result.current([vertexItem(added, { type: added, color: "#00BB00" })]);

    const styles = store.get(userVertexStylesAtom);
    expect(styles.get(kept)).toStrictEqual({ type: kept, color: "#0000CC" });
    expect(styles.get(added)).toStrictEqual({ type: added, color: "#00BB00" });
  });
});
