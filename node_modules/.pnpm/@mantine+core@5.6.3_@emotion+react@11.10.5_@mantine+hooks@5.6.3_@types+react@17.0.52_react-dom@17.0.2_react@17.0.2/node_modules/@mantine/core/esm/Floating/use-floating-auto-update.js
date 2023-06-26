import { useState, useEffect } from 'react';
import { autoUpdate } from '@floating-ui/react-dom-interactions';
import { useDidUpdate } from '@mantine/hooks';

function useFloatingAutoUpdate({ opened, floating, positionDependencies }) {
  const [delayedUpdate, setDelayedUpdate] = useState(0);
  useEffect(() => {
    if (floating.refs.reference.current && floating.refs.floating.current) {
      return autoUpdate(floating.refs.reference.current, floating.refs.floating.current, floating.update);
    }
    return void 0;
  }, [floating.refs.reference, floating.refs.floating, opened, delayedUpdate]);
  useDidUpdate(() => {
    floating.update();
  }, positionDependencies);
  useDidUpdate(() => {
    setDelayedUpdate((c) => c + 1);
  }, [opened]);
}

export { useFloatingAutoUpdate };
//# sourceMappingURL=use-floating-auto-update.js.map
