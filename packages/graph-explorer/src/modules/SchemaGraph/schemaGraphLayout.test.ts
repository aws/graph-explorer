// @vitest-environment happy-dom

import { useAtom, useAtomValue } from "jotai";
import { act } from "react";

import { schemaViewLayoutAtom } from "@/core/StateProvider/storageAtoms";
import { DbState, renderHookWithState } from "@/utils/testing";

import { schemaViewLayoutAlgorithmAtom } from "./schemaGraphLayout";

describe("schemaViewLayoutAlgorithmAtom", () => {
  it("exposes the persisted layout algorithm", () => {
    const state = new DbState().withSchemaViewLayout({
      activeSidebarItem: "styles",
      sidebar: { width: 420 },
      detailsAutoOpenOnSelection: false,
      layoutAlgorithm: "DAGRE_LR",
    });

    const { result } = renderHookWithState(
      () => useAtomValue(schemaViewLayoutAlgorithmAtom),
      state,
    );

    expect(result.current).toBe("DAGRE_LR");
  });

  it("keeps the persisted layout unchanged when selecting the current algorithm", () => {
    const state = new DbState().withSchemaViewLayout({
      activeSidebarItem: "styles",
      sidebar: { width: 420 },
      detailsAutoOpenOnSelection: false,
      layoutAlgorithm: "DAGRE_LR",
    });
    const { result } = renderHookWithState(() => {
      const [, setLayoutAlgorithm] = useAtom(schemaViewLayoutAlgorithmAtom);
      const layout = useAtomValue(schemaViewLayoutAtom);
      return { layout, setLayoutAlgorithm };
    }, state);
    const initialLayout = result.current.layout;

    act(() => result.current.setLayoutAlgorithm("DAGRE_LR"));

    expect(result.current.layout).toBe(initialLayout);
  });

  it("updates only the persisted layout algorithm", () => {
    const state = new DbState().withSchemaViewLayout({
      activeSidebarItem: "styles",
      sidebar: { width: 420 },
      detailsAutoOpenOnSelection: false,
      layoutAlgorithm: "DAGRE_LR",
    });
    const { result } = renderHookWithState(() => {
      const [, setLayoutAlgorithm] = useAtom(schemaViewLayoutAlgorithmAtom);
      const layout = useAtomValue(schemaViewLayoutAtom);
      return { layout, setLayoutAlgorithm };
    }, state);

    act(() => result.current.setLayoutAlgorithm("KLAY_TB"));

    expect(result.current.layout).toStrictEqual({
      activeSidebarItem: "styles",
      sidebar: { width: 420 },
      detailsAutoOpenOnSelection: false,
      layoutAlgorithm: "KLAY_TB",
    });
  });
});
