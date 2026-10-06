// @vitest-environment happy-dom

import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import type * as Connector from "@/connector";
import type * as Hooks from "@/hooks";

import { getAppStore } from "@/core";
import { graphViewLayoutAlgorithmAtom } from "@/modules/GraphViewer/graphViewLayoutAlgorithm";
import { createRandomGraphViewLayout, DbState } from "@/utils/testing";
import { renderHookWithState } from "@/utils/testing/renderHookWithJotai";

import type { GraphSessionStorageModel } from "./storage";

import { useRestoreGraphSession } from "./useRestoreGraphSession";

vi.mock("@/connector", async () => {
  const actual = await vi.importActual<typeof Connector>("@/connector");
  return {
    ...actual,
    fetchEntityDetails: vi.fn(() =>
      Promise.resolve({ entities: { vertices: [], edges: [] } }),
    ),
    notifyOnIncompleteRestoration: vi.fn(),
  };
});

vi.mock("@/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@/hooks");
  return {
    ...actual,
    useAddToGraph: () => vi.fn(() => Promise.resolve(undefined)),
  };
});

describe("useRestoreGraphSession", () => {
  it("writes the stored layout back into the View Layout", async () => {
    const dbState = new DbState().withGraphViewLayout({
      ...createRandomGraphViewLayout(),
      layoutAlgorithm: "F_COSE",
    });
    const { result } = renderHookWithState(
      () => useRestoreGraphSession(),
      dbState,
    );
    const store = getAppStore();

    const session: GraphSessionStorageModel = {
      vertices: new Set(),
      edges: new Set(),
      layout: "DAGRE_RL",
    };

    await act(async () => {
      await result.current.mutateAsync(session);
    });

    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_RL");
  });
});
