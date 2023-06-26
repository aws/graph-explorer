'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

function useTimeout(callback, delay, options = { autoInvoke: false }) {
  const timeoutRef = React.useRef(null);
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
  React.useEffect(() => {
    if (options.autoInvoke) {
      start();
    }
    return clear;
  }, [delay]);
  return { start, clear };
}

exports.useTimeout = useTimeout;
//# sourceMappingURL=use-timeout.js.map
