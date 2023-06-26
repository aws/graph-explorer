import { useEffect } from 'react';

function useWindowEvent(type, listener, options) {
  useEffect(() => {
    window.addEventListener(type, listener, options);
    return () => window.removeEventListener(type, listener, options);
  }, []);
}

export { useWindowEvent };
//# sourceMappingURL=use-window-event.js.map
