// @vitest-environment happy-dom
import { waitFor } from "@testing-library/react";
import { useAtom, useAtomValue } from "jotai";
import { act } from "react";

import type { GraphSessionStorageModel } from "@/core/StateProvider/graphSession/storage";

import { activeGraphSessionAtom, graphViewLayoutAlgorithmAtom } from "@/core";
import { DEFAULT_GRAPH_LAYOUT, type LayoutName } from "@/core/graphLayout";
import {
  createRandomEdge,
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

  const { result } = renderHookWithState<RestoreResult>(() => {
    const restore = useRestoreGraphSession();
    const [layout, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
    const session = useAtomValue(activeGraphSessionAtom);
    return { restore, layout, setLayout, session };
  }, new DbState(explorer));

  act(() => result.current.setLayout(currentLayout));
  return { result, source, target, edge };
}

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
