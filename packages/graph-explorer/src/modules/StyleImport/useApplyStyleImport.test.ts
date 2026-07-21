// @vitest-environment happy-dom
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
        [type, { type, color: "#old", shape: "star" }],
      ]),
    );

    const { result } = renderHookWithJotai(() => useApplyStyleImport());
    result.current([vertexItem(type, { type, color: "#new" })]);

    // Full-type replacement: the old `shape` is gone, not merged.
    expect(store.get(userVertexStylesAtom).get(type)).toStrictEqual({
      type,
      color: "#new",
    });
  });

  test("leaves unselected types untouched", () => {
    const kept = createVertexType("Country");
    const store = getAppStore();
    store.set(
      userVertexStylesAtom,
      new Map<VertexType, VertexStyleStorage>([
        [kept, { type: kept, color: "#keep" }],
      ]),
    );

    const added = createVertexType("Airport");
    const { result } = renderHookWithJotai(() => useApplyStyleImport());
    result.current([vertexItem(added, { type: added, color: "#new" })]);

    const styles = store.get(userVertexStylesAtom);
    expect(styles.get(kept)).toStrictEqual({ type: kept, color: "#keep" });
    expect(styles.get(added)).toStrictEqual({ type: added, color: "#new" });
  });
});
