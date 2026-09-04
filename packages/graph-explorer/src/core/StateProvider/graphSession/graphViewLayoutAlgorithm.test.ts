// @vitest-environment happy-dom
import { useAtom, useAtomValue } from "jotai";
import { act } from "react";

import {
  activeGraphSessionAtom,
  allGraphSessionsAtom,
  type EdgeId,
  useAvailablePreviousSession,
} from "@/core";
import { DEFAULT_GRAPH_LAYOUT } from "@/core/graphLayout";
import {
  createRandomConfigurationId,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import { graphViewLayoutAlgorithmAtom } from "./graphViewLayoutAlgorithm";

describe("graphViewLayoutAlgorithmAtom", () => {
  it("starts with the default graph layout", () => {
    const { result } = renderHookWithState(
      () => useAtomValue(graphViewLayoutAlgorithmAtom),
      new DbState(),
    );

    expect(result.current).toBe(DEFAULT_GRAPH_LAYOUT);
  });

  it("updates the transient live layout", () => {
    const { result } = renderHookWithState(() => {
      const [layout, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
      return { layout, setLayout };
    }, new DbState());

    act(() => result.current.setLayout("KLAY_TB"));

    expect(result.current.layout).toBe("KLAY_TB");
  });

  it("updates an existing nonempty active session", () => {
    const state = new DbState();
    state.createVertexInGraph();
    const { result } = renderHookWithState(() => {
      const [, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
      const session = useAtomValue(activeGraphSessionAtom);
      return { session, setLayout };
    }, state);

    act(() => result.current.setLayout("DAGRE_TB"));

    expect(result.current.session?.layout).toBe("DAGRE_TB");
  });

  it("does not update an existing empty active session", () => {
    const state = new DbState();
    const { result } = renderHookWithState(() => {
      const [, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
      const session = useAtomValue(activeGraphSessionAtom);
      const availableSession = useAvailablePreviousSession();
      return { session, availableSession, setLayout };
    }, state);
    const initialSession = result.current.session;

    act(() => result.current.setLayout("DAGRE_TB"));

    expect(result.current.session).toBe(initialSession);
    expect(result.current.availableSession).toBeNull();
  });

  it("does not revive a deleted active session", () => {
    const state = new DbState();
    const { result } = renderHookWithState(() => {
      const [, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
      const sessions = useAtomValue(allGraphSessionsAtom);
      return { sessions, setLayout };
    }, state);
    result.current.sessions.delete(state.activeConfig.id);

    act(() => result.current.setLayout("DAGRE_TB"));

    expect(result.current.sessions.has(state.activeConfig.id)).toBe(false);
  });

  it("preserves sessions belonging to other connections", () => {
    const state = new DbState();
    state.createVertexInGraph();
    const otherConnection = createRandomConfigurationId();
    const otherSession = {
      vertices: new Set(state.vertices.map(vertex => vertex.id)),
      edges: new Set<EdgeId>(),
      layout: "KLAY_LR" as const,
    };
    const { result } = renderHookWithState(() => {
      const [, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
      const sessions = useAtomValue(allGraphSessionsAtom);
      return { sessions, setLayout };
    }, state);
    result.current.sessions.set(otherConnection, otherSession);

    act(() => result.current.setLayout("DAGRE_TB"));

    expect(result.current.sessions.get(otherConnection)).toBe(otherSession);
  });
});
