// @vitest-environment happy-dom

import { useAtomValue } from "jotai";
import { act } from "react";
import { describe, expect, it } from "vite-plus/test";

import type { LayoutName } from "@/core/graphLayout";

import {
  activeConnectionIdAtom,
  allGraphSessionsAtom,
  getAppStore,
} from "@/core";
import { logger } from "@/utils";
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
    expect(sessions.get(dbState.activeConnection.id)?.layout).toBe("DAGRE_LR");
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * A session stored before the layout field existed carries no `layout`. The
 * `activeGraphSessionAtom` read seam leaves it absent, so an old session loads
 * without error and restoring it keeps the current layout, a new one keeps its
 * stored layout, and both coexist in the per-connection map. An unknown layout,
 * such as one a later build removed, reads as absent too, with a warning.
 *
 * DO NOT delete or weaken these tests without confirming that no such sessions
 * remain in the wild.
 */
describe("backward compatibility: legacy sessions without a layout", () => {
  it("reads a missing layout as absent, keeps a stored one, and both coexist", () => {
    const legacyConnection = new DbState().activeConnection;
    const dbState = new DbState()
      .addInactiveConnection(legacyConnection)
      .withGraphViewLayout({
        ...createRandomGraphViewLayout(),
        layoutAlgorithm: "DAGRE_LR",
      });
    const currentConnection = dbState.activeConnection;

    const { result } = renderHookWithState(
      () => useAtomValue(activeGraphSessionAtom),
      dbState,
    );
    const store = getAppStore();

    // Seed a legacy session (no layout) alongside the current one.
    const legacySession: GraphSessionStorageModel = {
      vertices: new Set(),
      edges: new Set(),
    };
    act(() => {
      store.set(allGraphSessionsAtom, previous => {
        const next = new Map(previous);
        next.set(legacyConnection.id, legacySession);
        return next;
      });
    });

    const sessions = store.get(allGraphSessionsAtom);
    expect(sessions.has(legacyConnection.id)).toBe(true);
    expect(sessions.has(currentConnection.id)).toBe(true);

    // The current connection's session reads its stored layout.
    expect(result.current?.layout).toBe("DAGRE_LR");

    // Switching to the legacy connection reads no layout.
    act(() => store.set(activeConnectionIdAtom, legacyConnection.id));
    const legacyRead = store.get(activeGraphSessionAtom);
    expect(legacyRead).not.toBeNull();
    expect(legacyRead?.layout).toBeUndefined();
  });

  it("reads an unknown layout as absent, with a warning", () => {
    const dbState = new DbState();
    renderHookWithState(() => useAtomValue(activeGraphSessionAtom), dbState);
    const store = getAppStore();

    const staleSession: GraphSessionStorageModel = {
      vertices: new Set(),
      edges: new Set(),
      layout: "REMOVED_LAYOUT" as LayoutName,
    };
    act(() => {
      store.set(allGraphSessionsAtom, previous =>
        new Map(previous).set(dbState.activeConnection.id, staleSession),
      );
    });

    expect(store.get(activeGraphSessionAtom)?.layout).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      "[graph-layout] Unrecognized layout name; keeping the current layout",
      "REMOVED_LAYOUT",
    );
  });
});
