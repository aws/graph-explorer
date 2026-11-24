// @vitest-environment happy-dom

import { act } from "react";
import { describe, expect, it } from "vite-plus/test";

import { allGraphSessionsAtom, getAppStore } from "@/core";
import { createRandomGraphViewLayout, DbState } from "@/utils/testing";
import { renderHookWithState } from "@/utils/testing/renderHookWithJotai";

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
