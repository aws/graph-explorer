import { renderHook } from "@testing-library/react";

import usePrevious from "./usePrevious";

describe("usePrevious", () => {
  it("should return null for the first render", () => {
    const { result } = renderHook(() => usePrevious(10));
    expect(result.current).toBeNull();
  });

  it("should return the previous value after a re-render", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 10 },
    });

    expect(result.current).toBeNull();

    rerender({ value: 20 });
    expect(result.current).toEqual(10);

    rerender({ value: 30 });
    expect(result.current).toEqual(20);
  });
});
