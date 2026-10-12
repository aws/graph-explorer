// @vitest-environment happy-dom

import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import * as Connector from "@/connector";
import { edgesAtom, getAppStore, nodesAtom } from "@/core";
import {
  createRandomEntities,
  createRandomGraphViewLayout,
  DbState,
} from "@/utils/testing";
import { renderHookWithState } from "@/utils/testing/renderHookWithJotai";

import type { GraphSessionStorageModel } from "./storage";

import { graphViewLayoutAlgorithmAtom } from "./graphViewLayoutAlgorithm";
import { activeGraphSessionAtom } from "./storage";
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

  it("restores the session's entities and its layout", async () => {
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
      layout: "CONCENTRIC",
    };

    await act(async () => {
      await result.current.mutateAsync(session);
    });

    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("CONCENTRIC");
    expect(new Set(store.get(nodesAtom).keys())).toStrictEqual(
      session.vertices,
    );
    expect(new Set(store.get(edgesAtom).keys())).toStrictEqual(session.edges);
    expect(store.get(activeGraphSessionAtom)?.layout).toBe("CONCENTRIC");
  });

  it("leaves the layout unchanged when the restore fetch fails", async () => {
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
      layout: "CONCENTRIC",
    };

    await act(async () => {
      await expect(result.current.mutateAsync(session)).rejects.toThrow(
        "fetch failed",
      );
    });

    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_LR");
  });
});
