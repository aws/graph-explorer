// @vitest-environment happy-dom
import { useAtomValue } from "jotai";
import { act } from "react";

import {
  createRandomVertex,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";

import {
  activeGraphSessionAtom,
  type GraphSessionStorageModel,
} from "./storage";
import { useAvailablePreviousSession } from "./useAvailablePreviousSession";
import { useRestoreGraphSession } from "./useRestoreGraphSession";

test("clears a previous session when none of its entities still exist", async () => {
  const missingVertex = createRandomVertex();
  const previousSession: GraphSessionStorageModel = {
    vertices: new Set([missingVertex.id]),
    edges: new Set(),
  };
  const state = new DbState(new FakeExplorer()).withGraphSession(
    previousSession,
  );

  const { result } = renderHookWithState(() => {
    const restore = useRestoreGraphSession();
    const availablePreviousSession = useAvailablePreviousSession();
    const activeGraphSession = useAtomValue(activeGraphSessionAtom);

    return { restore, availablePreviousSession, activeGraphSession };
  }, state);

  expect(result.current.availablePreviousSession).toStrictEqual(
    previousSession,
  );

  await act(() => result.current.restore.mutateAsync(previousSession));

  expect(result.current.restore.isSuccess).toBe(true);
  expect(result.current.availablePreviousSession).toBeNull();
  expect(result.current.activeGraphSession).toStrictEqual({
    vertices: new Set(),
    edges: new Set(),
  });
});
