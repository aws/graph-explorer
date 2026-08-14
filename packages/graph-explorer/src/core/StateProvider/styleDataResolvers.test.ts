// @vitest-environment happy-dom
import { act, waitFor } from "@testing-library/react";

import type { AppStore } from "@/core";

import { createEdgeType, createVertexType } from "@/core/entities";
import { DbState, renderHookWithJotai } from "@/utils/testing";

import { userEdgeStylesAtom, userVertexStylesAtom } from "./storageAtoms";
import {
  useEdgeStyleDataResolver,
  useVertexStyleDataResolver,
} from "./styleDataResolvers";

describe("useVertexStyleDataResolver", () => {
  it("should return the same object for repeated lookups of a type", () => {
    const type = createVertexType("Person");
    const { result } = renderHookWithJotai(() =>
      useVertexStyleDataResolver([]),
    );

    expect(result.current(type)).toBe(result.current(type));
  });

  // The cache is keyed only by type, so a style edit has to replace the whole
  // resolver. If it doesn't, the canvas keeps the old colors.
  it("should reflect a style edited after the first lookup", async () => {
    const type = createVertexType("Person");
    const dbState = new DbState();
    dbState.addVertexStyle(type, { color: "#111111" });

    let store!: AppStore;
    const { result } = renderHookWithJotai(
      () => useVertexStyleDataResolver([]),
      s => {
        store = s;
        dbState.applyTo(s);
      },
    );
    expect(result.current(type).ge_color).toBe("#111111");

    act(() =>
      store.set(userVertexStylesAtom, prev =>
        new Map(prev).set(type, { type, color: "#222222" }),
      ),
    );

    await waitFor(() => {
      expect(result.current(type).ge_color).toBe("#222222");
    });
  });

  it("should resolve distinct style data per type", () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("Person"), { color: "#111111" });
    dbState.addVertexStyle(createVertexType("City"), { color: "#222222" });

    const { result } = renderHookWithJotai(
      () => useVertexStyleDataResolver([]),
      store => dbState.applyTo(store),
    );

    expect(result.current(createVertexType("Person")).ge_color).toBe("#111111");
    expect(result.current(createVertexType("City")).ge_color).toBe("#222222");
  });

  // The canvas passes only the types it draws, so a type outside that scope must
  // still resolve — without an icon.
  it("should resolve a type outside the icon scope without an icon", () => {
    const { result } = renderHookWithJotai(() =>
      useVertexStyleDataResolver([]),
    );

    expect(result.current(createVertexType("Person")).ge_iconUrl).toBe("none");
  });
});

describe("useEdgeStyleDataResolver", () => {
  it("should reflect a style edited after the first lookup", async () => {
    const type = createEdgeType("route");
    const dbState = new DbState();
    dbState.addEdgeStyle(type, { lineColor: "#111111" });

    let store!: AppStore;
    const { result } = renderHookWithJotai(
      () => useEdgeStyleDataResolver(),
      s => {
        store = s;
        dbState.applyTo(s);
      },
    );
    expect(result.current(type).ge_lineColor).toBe("#111111");

    act(() =>
      store.set(userEdgeStylesAtom, prev =>
        new Map(prev).set(type, { type, lineColor: "#222222" }),
      ),
    );

    await waitFor(() => {
      expect(result.current(type).ge_lineColor).toBe("#222222");
    });
  });

  it("should return the same object for repeated lookups of a type", () => {
    const type = createEdgeType("route");
    const { result } = renderHookWithJotai(() => useEdgeStyleDataResolver());

    expect(result.current(type)).toBe(result.current(type));
  });

  it("should resolve distinct style data per type", () => {
    const dbState = new DbState();
    dbState.addEdgeStyle(createEdgeType("route"), { lineColor: "#111111" });
    dbState.addEdgeStyle(createEdgeType("owns"), { lineColor: "#222222" });

    const { result } = renderHookWithJotai(
      () => useEdgeStyleDataResolver(),
      store => dbState.applyTo(store),
    );

    expect(result.current(createEdgeType("route")).ge_lineColor).toBe(
      "#111111",
    );
    expect(result.current(createEdgeType("owns")).ge_lineColor).toBe("#222222");
  });
});
