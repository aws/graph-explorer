import { useCallback, useState } from "react";
import { addItems, deleteItems } from "../utils";

export default function useSet<T>(
  initialState = new Set<T>()
): {
  state: Set<T>;
  toggle: (value: T) => void;
  add: (value: T | T[]) => void;
  remove: (value: T | T[]) => void;
  clear: () => void;
} {
  const [state, setState] = useState<Set<T>>(initialState);
  const toggle = useCallback(
    (value: T) =>
      setState(s => {
        const newState = new Set(s);
        if (newState.has(value)) {
          newState.delete(value);
        } else {
          newState.add(value);
        }
        return newState;
      }),
    []
  );

  const remove = useCallback((value: T | T[]) => {
    setState(s => deleteItems(s, value));
  }, []);

  const add = useCallback((value: T | T[]) => {
    setState(s => addItems(s, value));
  }, []);

  const clear = useCallback(
    () =>
      setState(() => {
        return new Set([]);
      }),
    []
  );

  return { state, toggle, add, remove, clear };
}
