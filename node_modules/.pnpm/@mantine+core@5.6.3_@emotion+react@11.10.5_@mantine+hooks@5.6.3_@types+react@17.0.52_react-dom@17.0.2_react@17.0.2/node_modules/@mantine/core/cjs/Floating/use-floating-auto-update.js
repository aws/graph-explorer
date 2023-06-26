'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var reactDomInteractions = require('@floating-ui/react-dom-interactions');
var hooks = require('@mantine/hooks');

function useFloatingAutoUpdate({ opened, floating, positionDependencies }) {
  const [delayedUpdate, setDelayedUpdate] = React.useState(0);
  React.useEffect(() => {
    if (floating.refs.reference.current && floating.refs.floating.current) {
      return reactDomInteractions.autoUpdate(floating.refs.reference.current, floating.refs.floating.current, floating.update);
    }
    return void 0;
  }, [floating.refs.reference, floating.refs.floating, opened, delayedUpdate]);
  hooks.useDidUpdate(() => {
    floating.update();
  }, positionDependencies);
  hooks.useDidUpdate(() => {
    setDelayedUpdate((c) => c + 1);
  }, [opened]);
}

exports.useFloatingAutoUpdate = useFloatingAutoUpdate;
//# sourceMappingURL=use-floating-auto-update.js.map
