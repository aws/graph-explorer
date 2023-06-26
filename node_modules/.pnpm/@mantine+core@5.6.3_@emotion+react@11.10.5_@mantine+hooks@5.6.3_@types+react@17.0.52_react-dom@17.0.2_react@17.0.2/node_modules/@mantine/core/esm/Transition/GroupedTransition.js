import React from 'react';
import { getTransitionStyles } from './get-transition-styles/get-transition-styles.js';
import { useTransition } from './use-transition.js';

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
  const { transitionDuration, transitionStatus, transitionTimingFunction } = useTransition({
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
    return mounted ? /* @__PURE__ */ React.createElement(React.Fragment, null, children({})) : null;
  }
  if (transitionStatus === "exited") {
    return null;
  }
  const transitionsStyles = Object.keys(transitions).reduce((acc, transition) => {
    acc[transition] = getTransitionStyles({
      duration: transitions[transition].duration,
      transition: transitions[transition].transition,
      timingFunction: transitions[transition].timingFunction || transitionTimingFunction,
      state: transitionStatus
    });
    return acc;
  }, {});
  return /* @__PURE__ */ React.createElement(React.Fragment, null, children(transitionsStyles));
}
GroupedTransition.displayName = "@mantine/core/GroupedTransition";

export { GroupedTransition };
//# sourceMappingURL=GroupedTransition.js.map
