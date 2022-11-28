import { useEffect, useState } from "react";

const useDebounceValue = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return debouncedValue;
};

export default useDebounceValue;
