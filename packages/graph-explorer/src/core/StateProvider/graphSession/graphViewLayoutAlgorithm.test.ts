// @vitest-environment happy-dom

import { useAtom, useAtomValue } from "jotai";
import { act } from "react";
import { describe, expect, it } from "vite-plus/test";

import {
  createRandomGraphViewLayout,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import type { GraphViewLayout } from "../graphViewLayoutDefaults";

import { graphViewLayoutAtom } from "../storageAtoms";
import { graphViewLayoutAlgorithmAtom } from "./graphViewLayoutAlgorithm";

const storedLayout: GraphViewLayout = {
  ...createRandomGraphViewLayout(),
  layoutAlgorithm: "DAGRE_LR",
};

function renderLayoutAlgorithm() {
  return renderHookWithState(() => {
    const [layoutAlgorithm, setLayoutAlgorithm] = useAtom(
      graphViewLayoutAlgorithmAtom,
    );
    const layout = useAtomValue(graphViewLayoutAtom);
    return { layoutAlgorithm, layout, setLayoutAlgorithm };
  }, new DbState().withGraphViewLayout(storedLayout));
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
});
