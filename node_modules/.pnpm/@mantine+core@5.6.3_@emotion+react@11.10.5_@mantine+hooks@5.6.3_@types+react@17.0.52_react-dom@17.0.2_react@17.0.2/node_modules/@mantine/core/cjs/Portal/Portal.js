'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var reactDom = require('react-dom');
var hooks = require('@mantine/hooks');
var styles = require('@mantine/styles');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

function Portal(props) {
  const { children, target, className } = styles.useComponentDefaultProps("Portal", {}, props);
  const theme = styles.useMantineTheme();
  const [mounted, setMounted] = React.useState(false);
  const ref = React.useRef();
  hooks.useIsomorphicEffect(() => {
    setMounted(true);
    ref.current = !target ? document.createElement("div") : typeof target === "string" ? document.querySelector(target) : target;
    if (!target) {
      document.body.appendChild(ref.current);
    }
    return () => {
      !target && document.body.removeChild(ref.current);
    };
  }, [target]);
  if (!mounted) {
    return null;
  }
  return reactDom.createPortal(/* @__PURE__ */ React__default.createElement("div", {
    className,
    dir: theme.dir
  }, children), ref.current);
}
Portal.displayName = "@mantine/core/Portal";

exports.Portal = Portal;
//# sourceMappingURL=Portal.js.map
