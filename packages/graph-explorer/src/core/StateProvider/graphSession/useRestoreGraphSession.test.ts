// @vitest-environment happy-dom

import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as Connector from "@/connector";
import { getAppStore } from "@/core";
import { graphViewLayoutAlgorithmAtom } from "@/modules/GraphViewer/graphViewLayoutAlgorithm";
import {
  createRandomEntities,
  createRandomGraphViewLayout,
  DbState,
} from "@/utils/testing";
import { renderHookWithState } from "@/utils/testing/renderHookWithJotai";

import type { GraphSessionStorageModel } from "./storage";

import { useRestoreGraphSession } from "./useRestoreGraphSession";

function fetchResultWith(
  entities: Connector.FetchEntityDetailsResult["entities"],
): Connector.FetchEntityDetailsResult {
  return {
    entities,
    counts: { notFound: { vertices: 0, edges: 0, total: 0 } },
  };
}

describe("useRestoreGraphSession", () => {
  afterEach(() => vi.restoreAllMocks());

  it("restores the session entities without touching the View Layout", async () => {
    const entities = createRandomEntities();
    vi.spyOn(Connector, "fetchEntityDetails").mockResolvedValue(
      fetchResultWith({ vertices: entities.vertices, edges: entities.edges }),
    );
    vi.spyOn(Connector, "notifyOnIncompleteRestoration").mockImplementation(
      () => undefined,
    );

    // The user's current, persisted choice is DAGRE_LR; the stored session
    // snapshot still carries the older F_COSE because the layout was changed
    // without adding or removing a node. Restoring must keep the user's choice.
    const dbState = new DbState().withGraphViewLayout({
      ...createRandomGraphViewLayout(),
      layoutAlgorithm: "DAGRE_LR",
    });
    const { result } = renderHookWithState(
      () => useRestoreGraphSession(),
      dbState,
    );
    const store = getAppStore();

    const session: GraphSessionStorageModel = {
      vertices: new Set(entities.vertices.map(v => v.id)),
      edges: new Set(entities.edges.map(e => e.id)),
      layout: "F_COSE",
    };

    await act(async () => {
      await result.current.mutateAsync(session);
    });

    // The View Layout keeps the user's selection; the stale session layout did
    // not overwrite it.
    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_LR");
  });

  it("keeps the View Layout stable across repeated restores", async () => {
    const entities = createRandomEntities();
    vi.spyOn(Connector, "fetchEntityDetails").mockResolvedValue(
      fetchResultWith({ vertices: entities.vertices, edges: entities.edges }),
    );
    vi.spyOn(Connector, "notifyOnIncompleteRestoration").mockImplementation(
      () => undefined,
    );

    const dbState = new DbState().withGraphViewLayout({
      ...createRandomGraphViewLayout(),
      layoutAlgorithm: "DAGRE_LR",
    });
    const { result } = renderHookWithState(
      () => useRestoreGraphSession(),
      dbState,
    );
    const store = getAppStore();

    const session: GraphSessionStorageModel = {
      vertices: new Set(entities.vertices.map(v => v.id)),
      edges: new Set(entities.edges.map(e => e.id)),
      layout: "F_COSE",
    };

    // Restoring repeatedly must not flip the layout back and forth.
    await act(async () => {
      await result.current.mutateAsync(session);
    });
    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_LR");

    await act(async () => {
      await result.current.mutateAsync(session);
    });
    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_LR");
  });

  it("does not change the View Layout when the restore fetch fails", async () => {
    const dbState = new DbState().withGraphViewLayout({
      ...createRandomGraphViewLayout(),
      layoutAlgorithm: "DAGRE_LR",
    });
    const { result } = renderHookWithState(
      () => useRestoreGraphSession(),
      dbState,
    );
    const store = getAppStore();

    vi.spyOn(Connector, "fetchEntityDetails").mockRejectedValue(
      new Error("fetch failed"),
    );

    const session: GraphSessionStorageModel = {
      vertices: new Set(),
      edges: new Set(),
      layout: "F_COSE",
    };

    await act(async () => {
      await expect(result.current.mutateAsync(session)).rejects.toThrow(
        "fetch failed",
      );
    });

    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_LR");
  });
});
