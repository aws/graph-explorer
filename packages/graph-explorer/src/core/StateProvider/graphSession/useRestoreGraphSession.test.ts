// @vitest-environment happy-dom
import { waitFor } from "@testing-library/react";
import { useAtom, useAtomValue } from "jotai";
import { act } from "react";

import type { GraphSessionStorageModel } from "@/core/StateProvider/graphSession/storage";

import { activeGraphSessionAtom, graphViewLayoutAlgorithmAtom } from "@/core";
import { DEFAULT_GRAPH_LAYOUT, type LayoutName } from "@/core/graphLayout";
import { logger } from "@/utils";
import {
  createRandomEdge,
  createRandomRawConfiguration,
  createRandomVertex,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";

import { useRestoreGraphSession } from "./useRestoreGraphSession";

type RestoreResult = {
  restore: ReturnType<typeof useRestoreGraphSession>;
  layout: ReturnType<typeof useAtomValue<typeof graphViewLayoutAlgorithmAtom>>;
  setLayout: (layout: LayoutName) => void;
  session: ReturnType<typeof useAtomValue<typeof activeGraphSessionAtom>>;
};

function setup(currentLayout = DEFAULT_GRAPH_LAYOUT) {
  const explorer = new FakeExplorer();
  const source = createRandomVertex();
  const target = createRandomVertex();
  const edge = createRandomEdge(source, target);
  explorer.addVertex(source);
  explorer.addVertex(target);
  explorer.addEdge(edge);

  const state = new DbState(explorer);

  const { result } = renderHookWithState<RestoreResult>(() => {
    const restore = useRestoreGraphSession();
    const [layout, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
    const session = useAtomValue(activeGraphSessionAtom);
    return { restore, layout, setLayout, session };
  }, state);

  act(() => result.current.setLayout(currentLayout));

  return { result, explorer, source, target, edge };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

it("applies the saved layout after restoring entities", async () => {
  const { result, source, target, edge } = setup("F_COSE");

  const session: GraphSessionStorageModel = {
    vertices: new Set([source.id, target.id]),
    edges: new Set([edge.id]),
    layout: "DAGRE_TB",
  };

  act(() => result.current.restore.mutate(session));

  await waitFor(() => {
    expect(result.current.layout).toBe("DAGRE_TB");
    expect(result.current.session?.layout).toBe("DAGRE_TB");
    expect(result.current.session?.vertices).toStrictEqual(
      new Set([source.id, target.id]),
    );
  });
});

it("preserves the current live layout when the saved session has none", async () => {
  const { result, source, target, edge } = setup("KLAY_LR");

  const session: GraphSessionStorageModel = {
    vertices: new Set([source.id, target.id]),
    edges: new Set([edge.id]),
  };

  act(() => result.current.restore.mutate(session));

  await waitFor(() => {
    expect(result.current.layout).toBe("KLAY_LR");
    expect(result.current.session?.layout).toBe("KLAY_LR");
  });
});

it("preserves the source session when the explorer cannot restore every vertex", async () => {
  const explorer = new FakeExplorer();
  const v1 = createRandomVertex();
  const v2 = createRandomVertex();
  const v3 = createRandomVertex();
  const missing = createRandomVertex();
  explorer.addVertex(v1);
  explorer.addVertex(v2);
  explorer.addVertex(v3);

  const edges = [createRandomEdge(v1, v2), createRandomEdge(v2, v3)];
  for (const edge of edges) {
    explorer.addEdge(edge);
  }

  const arrangement = {
    positions: [
      { id: v1.id, x: 1, y: 1 },
      { id: v2.id, x: 2, y: 2 },
      { id: v3.id, x: 3, y: 3 },
      { id: missing.id, x: 4, y: 4 },
    ],
    viewport: { pan: { x: 0, y: 0 }, zoom: 1 },
  };

  const state = new DbState(explorer);
  state.activeConfig = createRandomRawConfiguration();
  state.withGraphSession({
    vertices: new Set([v1.id, v2.id, v3.id, missing.id]),
    edges: new Set(edges.map(e => e.id)),
    layout: "DAGRE_TB",
    arrangement,
  });

  const { result } = renderHookWithState<RestoreResult>(() => {
    const restore = useRestoreGraphSession();
    const [layout, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
    const session = useAtomValue(activeGraphSessionAtom);
    return { restore, layout, setLayout, session };
  }, state);

  act(() => result.current.setLayout("KLAY_LR"));

  const session: GraphSessionStorageModel = {
    vertices: new Set([v1.id, v2.id, v3.id, missing.id]),
    edges: new Set(edges.map(e => e.id)),
    layout: "DAGRE_TB",
    arrangement,
  };

  let restoreResult:
    | Awaited<ReturnType<typeof result.current.restore.mutateAsync>>
    | undefined;
  await act(async () => {
    restoreResult = await result.current.restore.mutateAsync(session);
  });

  expect(restoreResult?.counts.notFound.vertices).toBe(1);
  expect(restoreResult?.entities.vertices).toHaveLength(3);
  expect(result.current.session?.vertices.size).toBe(4);
  expect(result.current.session?.edges.size).toBe(2);
  expect(result.current.session?.layout).toBe("DAGRE_TB");
  expect(result.current.session?.arrangement?.positions).toHaveLength(4);
  expect(
    result.current.session?.arrangement?.positions.some(
      p => p.id === missing.id,
    ),
  ).toBe(true);
});

it("restores an endpoint-only vertex from its saved edge", async () => {
  const explorer = new FakeExplorer();
  const source = createRandomVertex();
  const endpointOnly = createRandomVertex();
  const edge = createRandomEdge(source, endpointOnly);
  explorer.addVertex(source);
  explorer.addEdge(edge);

  const state = new DbState(explorer);
  state.withGraphSession({
    vertices: new Set([source.id, endpointOnly.id]),
    edges: new Set([edge.id]),
    layout: "DAGRE_TB",
  });

  const { result } = renderHookWithState<RestoreResult>(() => {
    const restore = useRestoreGraphSession();
    const [layout, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
    const session = useAtomValue(activeGraphSessionAtom);
    return { restore, layout, setLayout, session };
  }, state);

  let restoreResult:
    | Awaited<ReturnType<typeof result.current.restore.mutateAsync>>
    | undefined;
  await act(async () => {
    restoreResult = await result.current.restore.mutateAsync({
      vertices: new Set([source.id, endpointOnly.id]),
      edges: new Set([edge.id]),
      layout: "DAGRE_TB",
    });
  });

  expect(restoreResult?.counts.notFound.vertices).toBe(0);
  expect(restoreResult?.entities.vertices.map(vertex => vertex.id)).toContain(
    endpointOnly.id,
  );
});

it("leaves the live layout unchanged when entity restoration fails", async () => {
  const { result, explorer, source } = setup("KLAY_LR");
  const failure = new Error("restore failed");
  const session: GraphSessionStorageModel = {
    vertices: new Set([source.id]),
    edges: new Set(),
    layout: "DAGRE_TB",
  };
  vi.spyOn(explorer, "vertexDetails").mockRejectedValue(failure);
  vi.spyOn(logger, "error").mockImplementation(() => {});

  await act(async () => {
    await expect(result.current.restore.mutateAsync(session)).rejects.toThrow(
      failure,
    );
  });

  expect(result.current.layout).toBe("KLAY_LR");
});
