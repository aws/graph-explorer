// @vitest-environment happy-dom

import { useAtomValue } from "jotai";
import { act } from "react";
import { describe, expect, it } from "vitest";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  getAppStore,
} from "@/core";
import { graphViewLayoutAlgorithmAtom } from "@/modules/GraphViewer/graphViewLayoutAlgorithm";
import { createRandomGraphViewLayout, DbState } from "@/utils/testing";
import { renderHookWithState } from "@/utils/testing/renderHookWithJotai";

import type { GraphSessionStorageModel } from "./storage";

import { activeGraphSessionAtom } from "./storage";
import { useUpdateGraphSession } from "./useUpdateGraphSession";

describe("useUpdateGraphSession", () => {
  it("stores the current View Layout algorithm into the active connection's session", () => {
    const dbState = new DbState().withGraphViewLayout({
      ...createRandomGraphViewLayout(),
      layoutAlgorithm: "DAGRE_LR",
    });
    const { result } = renderHookWithState(
      () => useUpdateGraphSession(),
      dbState,
    );
    const store = getAppStore();

    act(() => result.current());

    const sessions = store.get(allGraphSessionsAtom);
    expect(sessions.get(dbState.activeConfig.id)?.layout).toBe("DAGRE_LR");
  });

  // Regression: the old live global layout atom was never reset when switching
  // connections, so the next update wrote connection A's layout into connection
  // B's session. The View Layout-backed atom writes only the active
  // connection's session, so A's snapshot is untouched when B is updated.
  it("does not write one connection's layout into another's session", () => {
    const connectionB = new DbState().activeConfig;
    const dbState = new DbState()
      .addInactiveConnection(connectionB)
      .withGraphViewLayout({
        ...createRandomGraphViewLayout(),
        layoutAlgorithm: "DAGRE_LR",
      });
    const connectionA = dbState.activeConfig;

    const { result } = renderHookWithState(
      () => useUpdateGraphSession(),
      dbState,
    );
    const store = getAppStore();

    // Update connection A with its layout.
    act(() => result.current());
    expect(store.get(allGraphSessionsAtom).get(connectionA.id)?.layout).toBe(
      "DAGRE_LR",
    );

    // Switch to connection B and choose a different layout, then update.
    act(() => {
      store.set(activeConfigurationAtom, connectionB.id);
      store.set(graphViewLayoutAlgorithmAtom, "KLAY_TB");
    });
    act(() => result.current());

    const sessions = store.get(allGraphSessionsAtom);
    expect(sessions.get(connectionB.id)?.layout).toBe("KLAY_TB");
    expect(sessions.get(connectionA.id)?.layout).toBe("DAGRE_LR");
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * A session stored before the layout field existed carries no `layout`. The
 * `activeGraphSessionAtom` read seam coerces it to F_COSE, so an old session
 * loads without error, a new one keeps its stored layout, and both coexist in
 * the per-connection map.
 *
 * DO NOT delete or weaken these tests without confirming that no such sessions
 * remain in the wild.
 */
describe("backward compatibility: legacy sessions without a layout", () => {
  it("reads a missing layout as F_COSE, keeps a stored one, and both coexist", () => {
    const legacyConnection = new DbState().activeConfig;
    const dbState = new DbState()
      .addInactiveConnection(legacyConnection)
      .withGraphViewLayout({
        ...createRandomGraphViewLayout(),
        layoutAlgorithm: "DAGRE_LR",
      });
    const currentConnection = dbState.activeConfig;

    const { result } = renderHookWithState(
      () => useAtomValue(activeGraphSessionAtom),
      dbState,
    );
    const store = getAppStore();

    // Seed a legacy session (no layout) alongside the current one.
    const legacySession: Omit<GraphSessionStorageModel, "layout"> = {
      vertices: new Set(),
      edges: new Set(),
    };
    act(() => {
      store.set(allGraphSessionsAtom, previous => {
        const next = new Map(previous);
        next.set(
          legacyConnection.id,
          legacySession as GraphSessionStorageModel,
        );
        return next;
      });
    });

    const sessions = store.get(allGraphSessionsAtom);
    expect(sessions.has(legacyConnection.id)).toBe(true);
    expect(sessions.has(currentConnection.id)).toBe(true);

    // The current connection's session reads its stored layout.
    expect(result.current?.layout).toBe("DAGRE_LR");

    // Switching to the legacy connection reads a quiet F_COSE fallback.
    act(() => store.set(activeConfigurationAtom, legacyConnection.id));
    const legacyRead = store.get(activeGraphSessionAtom);
    expect(legacyRead?.layout).toBe("F_COSE");
  });
});
