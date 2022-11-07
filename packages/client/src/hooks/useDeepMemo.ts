import isEqual from "lodash/isEqual";
import { useRef } from "react";
// * Gracefully copied from https://github.com/apollographql/react-apollo/blob/master/packages/hooks/src/utils/useDeepMemo.ts

/**
 * Memoize a result using deep equality. This hook has two advantages over
 * React.useMemo: it uses deep equality to compare memo keys, and it guarantees
 * that the memo function will only be called if the keys are unequal.
 * React.useMemo cannot be relied on to do this, since it is only a performance
 * optimization (see https://reactjs.org/docs/hooks-reference.html#usememo).
 */
export const useDeepMemo = <TKey, TValue>(
  memoFn: () => TValue,
  key: TKey
): TValue => {
  const ref = useRef<{ key: TKey; value: TValue }>();

  if (!ref.current || !isEqual(key, ref.current.key)) {
    ref.current = { key, value: memoFn() };
  }

  return ref.current.value;
};

export default useDeepMemo;
