// @vitest-environment happy-dom

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { act } from "react";
import { describe, expect, it } from "vite-plus/test";

import { useActivateConnection } from "@/connections";
import { allGraphSessionsAtom, getAppStore } from "@/core";
import {
  createRandomGraphViewLayout,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import type { GraphViewLayout } from "../graphViewLayoutDefaults";

import { graphViewLayoutAtom } from "../storageAtoms";
import { graphViewLayoutAlgorithmAtom } from "./graphViewLayoutAlgorithm";
import {
  activeGraphSessionAtom,
  isRestorePreviousSessionAvailableAtom,
} from "./storage";

const storedLayout: GraphViewLayout = {
  ...createRandomGraphViewLayout(),
  layoutAlgorithm: "DAGRE_LR",
};

function renderLayoutAlgorithm(dbState = new DbState()) {
  return renderHookWithState(() => {
    const [layoutAlgorithm, setLayoutAlgorithm] = useAtom(
      graphViewLayoutAlgorithmAtom,
    );
    const layout = useAtomValue(graphViewLayoutAtom);
    return { layoutAlgorithm, layout, setLayoutAlgorithm };
  }, dbState.withGraphViewLayout(storedLayout));
}

describe("graphViewLayoutAlgorithmAtom", () => {
  it("exposes the persisted layout algorithm", () => {
    const { result } = renderLayoutAlgorithm();

    expect(result.current.layoutAlgorithm).toBe("DAGRE_LR");
  });

  it("keeps the persisted layout unchanged when selecting the current algorithm", () => {
    const { result } = renderLayoutAlgorithm();
    const initialLayout = result.current.layout;

    act(() => result.current.setLayoutAlgorithm("DAGRE_LR"));

    expect(result.current.layout).toBe(initialLayout);
  });

  it("updates only the persisted layout algorithm", () => {
    const { result } = renderLayoutAlgorithm();

    act(() => result.current.setLayoutAlgorithm("KLAY_TB"));

    expect(result.current.layout).toStrictEqual({
      ...storedLayout,
      layoutAlgorithm: "KLAY_TB",
    });
  });

  it("updates the active Session's layout once the graph has changed", () => {
    const { result } = renderLayoutAlgorithm();
    const store = getAppStore();
    act(() => store.set(isRestorePreviousSessionAvailableAtom, false));

    act(() => result.current.setLayoutAlgorithm("KLAY_TB"));

    expect(store.get(activeGraphSessionAtom)?.layout).toBe("KLAY_TB");
  });

  it("leaves a previous Session that awaits restore untouched", () => {
    const { result } = renderLayoutAlgorithm();
    const store = getAppStore();

    act(() => result.current.setLayoutAlgorithm("KLAY_TB"));

    expect(store.get(activeGraphSessionAtom)?.layout).toBe("DAGRE_LR");
  });

  it("keeps each connection's saved layout when switching connections", () => {
    const connectionB = new DbState().activeConnection;
    const dbState = new DbState()
      .addInactiveConnection(connectionB)
      .withGraphViewLayout(storedLayout);
    const connectionA = dbState.activeConnection;
    const { result } = renderHookWithState(
      () => ({
        setLayoutAlgorithm: useSetAtom(graphViewLayoutAlgorithmAtom),
        activateConnection: useActivateConnection(),
      }),
      dbState,
    );
    const store = getAppStore();
    act(() => {
      store.set(allGraphSessionsAtom, previous =>
        new Map(previous).set(connectionB.id, {
          vertices: new Set(),
          edges: new Set(),
          layout: "CONCENTRIC",
        }),
      );
      store.set(isRestorePreviousSessionAvailableAtom, false);
    });

    act(() => result.current.activateConnection(connectionB.id));
    act(() => result.current.setLayoutAlgorithm("KLAY_TB"));

    const sessions = store.get(allGraphSessionsAtom);
    expect(sessions.get(connectionA.id)?.layout).toBe("DAGRE_LR");
    expect(sessions.get(connectionB.id)?.layout).toBe("CONCENTRIC");
  });

  it("creates no Session when the connection has none", () => {
    const { result } = renderLayoutAlgorithm();
    const store = getAppStore();
    act(() => {
      store.set(allGraphSessionsAtom, new Map());
      store.set(isRestorePreviousSessionAvailableAtom, false);
    });

    act(() => result.current.setLayoutAlgorithm("KLAY_TB"));

    expect(store.get(allGraphSessionsAtom).size).toBe(0);
  });
});
