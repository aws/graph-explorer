import { useEffect, useRef } from "react";

const usePrevious = <T>(value: T) => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

export default usePrevious;



const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

// Test cases
describe('usePrevious', () => {
  it('should return undefined for the first render', () => {
    const value = 10;
    const previousValue = usePrevious(value);
    expect(previousValue).toBeUndefined();
  });

  it('should return the previous value after a re-render', () => {
    const value = 10;
    const { rerender } = renderHook(() => usePrevious(value));
    expect(result.current).toBeUndefined();
    rerender({ value: 20 });
    expect(result.current).toEqual(10);
    rerender({ value: 30 });
    expect(result.current).toEqual(20);
  });
});