import { useCallback, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

const useClickAndHold = (effect = NOOP) => {
  const isHeld = useRef(false);
  const effectFn = useRef<() => void>();
  effectFn.current = effect;

  const runEffect = useCallback(() => {
    effectFn.current?.();
  }, []);

  const checkLoop = useCallback(() => {
    if (isHeld.current) {
      runEffect();
      setTimeout(() => {
        checkLoop();
      }, 25);
    }
  }, [runEffect]);

  const onMouseDown = useCallback(() => {
    isHeld.current = true;
    checkLoop();
  }, [checkLoop]);

  const onMouseUp = useCallback(() => {
    isHeld.current = false;
  }, []);

  const onMouseLeave = useCallback(() => {
    isHeld.current = false;
  }, []);

  return {
    onPressStart: onMouseDown,
    onPressEnd: onMouseUp,
    onMouseLeave,
  };
};

export default useClickAndHold;
