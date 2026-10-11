// @vitest-environment happy-dom

import { useAtom, useAtomValue } from "jotai";
import { act } from "react";
import { describe, expect, it } from "vitest";

import type { SchemaViewLayout } from "@/core/StateProvider/schemaViewLayoutDefaults";

import { schemaViewLayoutAtom } from "@/core/StateProvider/storageAtoms";
import {
  createRandomSchemaViewLayout,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import { schemaViewLayoutAlgorithmAtom } from "./schemaViewLayoutAlgorithm";

const storedLayout: SchemaViewLayout = {
  ...createRandomSchemaViewLayout(),
  layoutAlgorithm: "DAGRE_LR",
};

function renderLayoutAlgorithm() {
  return renderHookWithState(() => {
    const [layoutAlgorithm, setLayoutAlgorithm] = useAtom(
      schemaViewLayoutAlgorithmAtom,
    );
    const layout = useAtomValue(schemaViewLayoutAtom);
    return { layoutAlgorithm, layout, setLayoutAlgorithm };
  }, new DbState().withSchemaViewLayout(storedLayout));
}

describe("schemaViewLayoutAlgorithmAtom", () => {
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
