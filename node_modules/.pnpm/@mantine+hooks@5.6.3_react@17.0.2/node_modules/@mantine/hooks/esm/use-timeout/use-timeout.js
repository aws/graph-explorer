import { useRef, useEffect } from 'react';

function useTimeout(callback, delay, options = { autoInvoke: false }) {
  const timeoutRef = useRef(null);
  const start = (...callbackParams) => {
    if (!timeoutRef.current) {
      timeoutRef.current = window.setTimeout(() => {
        callback(callbackParams);
        timeoutRef.current = null;
      }, delay);
    }
  };
  const clear = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  useEffect(() => {
    if (options.autoInvoke) {
      start();
    }
    return clear;
  }, [delay]);
  return { start, clear };
}

export { useTimeout };
//# sourceMappingURL=use-timeout.js.map
