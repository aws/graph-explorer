// @vitest-environment happy-dom
import { act, waitFor } from "@testing-library/react";
import { useAtomValue } from "jotai";

import type { AppStore } from "@/core";

import { createVertexType, type VertexType } from "@/core/entities";
import { DbState, renderHookWithJotai } from "@/utils/testing";

import { vertexStyleAtom } from "./graphStyles";
import { userVertexStylesAtom } from "./storageAtoms";
import { useVertexStyleDataByType } from "./styleDataResolvers";

/** Mirrors a caller: resolve the styles for a scope, then build the style data. */
function useStyleDataForTypes(types: VertexType[]) {
  const styles = useAtomValue(vertexStyleAtom);
  return useVertexStyleDataByType(types.map(type => styles.get(type)));
}

describe("useVertexStyleDataByType", () => {
  it("should reflect a style edited after the first render", async () => {
    const type = createVertexType("Person");
    const dbState = new DbState();
    dbState.addVertexStyle(type, { color: "#111111" });

    let store!: AppStore;
    const { result } = renderHookWithJotai(
      () => useStyleDataForTypes([type]),
      s => {
        store = s;
        dbState.applyTo(s);
      },
    );
    expect(result.current.get(type)?.ge_color).toBe("#111111");

    act(() =>
      store.set(userVertexStylesAtom, prev =>
        new Map(prev).set(type, { type, color: "#222222" }),
      ),
    );

    await waitFor(() => {
      expect(result.current.get(type)?.ge_color).toBe("#222222");
    });
  });

  it("should resolve distinct style data per type", () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("Person"), { color: "#111111" });
    dbState.addVertexStyle(createVertexType("City"), { color: "#222222" });

    const { result } = renderHookWithJotai(
      () =>
        useStyleDataForTypes([
          createVertexType("Person"),
          createVertexType("City"),
        ]),
      store => dbState.applyTo(store),
    );

    expect(result.current.get(createVertexType("Person"))?.ge_color).toBe(
      "#111111",
    );
    expect(result.current.get(createVertexType("City"))?.ge_color).toBe(
      "#222222",
    );
  });

  // Scalar fields and icon come from the same list, so a type outside the scope
  // is absent rather than present-but-icon-less.
  it("should omit a type outside the given styles", () => {
    const { result } = renderHookWithJotai(() =>
      useStyleDataForTypes([createVertexType("Person")]),
    );

    expect(result.current.has(createVertexType("City"))).toBe(false);
    expect(result.current.get(createVertexType("Person"))?.ge_iconUrl).toBe(
      "none",
    );
  });
});
