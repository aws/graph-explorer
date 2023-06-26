'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var getTransitionStyles = require('./get-transition-styles/get-transition-styles.js');
var useTransition = require('./use-transition.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

function GroupedTransition({
  transitions,
  duration = 250,
  exitDuration = duration,
  mounted,
  children,
  timingFunction,
  onExit,
  onEntered,
  onEnter,
  onExited
}) {
  const { transitionDuration, transitionStatus, transitionTimingFunction } = useTransition.useTransition({
    mounted,
    duration,
    exitDuration,
    timingFunction,
    onExit,
    onEntered,
    onEnter,
    onExited
  });
  if (transitionDuration === 0) {
    return mounted ? /* @__PURE__ */ React__default.createElement(React__default.Fragment, null, children({})) : null;
  }
  if (transitionStatus === "exited") {
    return null;
  }
  const transitionsStyles = Object.keys(transitions).reduce((acc, transition) => {
    acc[transition] = getTransitionStyles.getTransitionStyles({
      duration: transitions[transition].duration,
      transition: transitions[transition].transition,
      timingFunction: transitions[transition].timingFunction || transitionTimingFunction,
      state: transitionStatus
    });
    return acc;
  }, {});
  return /* @__PURE__ */ React__default.createElement(React__default.Fragment, null, children(transitionsStyles));
}
GroupedTransition.displayName = "@mantine/core/GroupedTransition";

exports.GroupedTransition = GroupedTransition;
//# sourceMappingURL=GroupedTransition.js.map
