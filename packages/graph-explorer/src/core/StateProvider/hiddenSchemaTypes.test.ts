// @vitest-environment happy-dom
import { act } from "react";

import { createVertexType, getAppStore } from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";

import { useHiddenSchemaTypes } from "./hiddenSchemaTypes";
import { hiddenSchemaTypesAtom } from "./storageAtoms";

describe("useHiddenSchemaTypes", () => {
  it("starts with no hidden types", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useHiddenSchemaTypes(),
      dbState,
    );

    expect(result.current.isHidden(createVertexType("Vertex"))).toBe(false);
    expect(result.current.hiddenTypes.size).toBe(0);
  });

  it("toggles a type on and off for the active connection", () => {
    const dbState = new DbState();
    const type = createVertexType("Vertex");
    const { result } = renderHookWithState(
      () => useHiddenSchemaTypes(),
      dbState,
    );

    act(() => result.current.toggleType(type));
    expect(result.current.isHidden(type)).toBe(true);

    act(() => result.current.toggleType(type));
    expect(result.current.isHidden(type)).toBe(false);
  });

  it("removes the connection's map entry once its set empties", () => {
    const dbState = new DbState();
    const type = createVertexType("Vertex");
    const store = getAppStore();
    const { result } = renderHookWithState(
      () => useHiddenSchemaTypes(),
      dbState,
    );

    act(() => result.current.toggleType(type));
    expect(store.get(hiddenSchemaTypesAtom).has(dbState.activeConfig.id)).toBe(
      true,
    );

    act(() => result.current.toggleType(type));
    expect(store.get(hiddenSchemaTypesAtom).has(dbState.activeConfig.id)).toBe(
      false,
    );
  });

  it("isolates hidden types per connection", () => {
    const dbState = new DbState();
    const type = createVertexType("Vertex");
    const store = getAppStore();
    const { result } = renderHookWithState(
      () => useHiddenSchemaTypes(),
      dbState,
    );

    act(() => result.current.toggleType(type));

    const map = store.get(hiddenSchemaTypesAtom);
    expect(map.size).toBe(1);
    expect([...map.keys()]).toStrictEqual([dbState.activeConfig.id]);
  });
});
