import { renderHook, act } from "@testing-library/react-hooks";
import useSet from "./useSet";

describe("Utils > Hooks > useSet", () => {
  it("Should create a new object with keys: state, toogle, add, remove, clear", () => {
    const { result } = renderHook(() => useSet(new Set([1, 2, 3])));
    expect(Object.keys(result.current)).toEqual([
      "state",
      "toggle",
      "add",
      "remove",
      "clear",
    ]);
    //Assert initial state
    expect(result.current.state).toEqual(new Set([1, 2, 3]));
    expect(result.current.toggle).toBeInstanceOf(Function);
    expect(result.current.add).toBeInstanceOf(Function);
    expect(result.current.remove).toBeInstanceOf(Function);
    expect(result.current.clear).toBeInstanceOf(Function);
  });

  it("Should add a new Item or Items to the initial state", () => {
    const { result } = renderHook(() => useSet());
    act(() => result.current.add(1));
    expect(result.current.state).toEqual(new Set([1]));

    act(() => result.current.add([2, 3, 4, 5]));
    expect(result.current.state).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it("Should remove a new Item or Items to the initial state", () => {
    const { result } = renderHook(() => useSet(new Set([1, 2, 3, 4, 5])));
    act(() => result.current.remove(1));
    expect(result.current.state).toEqual(new Set([2, 3, 4, 5]));

    act(() => result.current.remove([2, 3, 4, 5]));
    expect(result.current.state).toEqual(new Set([]));
  });

  it("Should add item if item does not exist or remove it otherwise", () => {
    const { result } = renderHook(() => useSet(new Set([1, 2, 3, 4, 5])));
    act(() => result.current.toggle(1));
    expect(result.current.state).toEqual(new Set([2, 3, 4, 5]));

    act(() => result.current.toggle(6));
    expect(result.current.state).toEqual(new Set([2, 3, 4, 5, 6]));
  });

  it("Should clear all items from state", () => {
    const { result } = renderHook(() => useSet(new Set([1, 2, 3, 4, 5])));
    act(() => result.current.clear());
    expect(result.current.state).toEqual(new Set([]));
  });
});
