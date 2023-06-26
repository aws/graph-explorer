import React from 'react';
import { Group } from '../../Group/Group.js';
import { Stack } from '../../Stack/Stack.js';

function InputsGroup({
  spacing,
  offset,
  orientation,
  children,
  role,
  unstyled
}) {
  if (orientation === "horizontal") {
    return /* @__PURE__ */ React.createElement(Group, {
      pt: offset,
      spacing,
      role,
      unstyled
    }, children);
  }
  return /* @__PURE__ */ React.createElement(Stack, {
    pt: offset,
    spacing,
    role,
    unstyled
  }, children);
}

export { InputsGroup };
//# sourceMappingURL=InputsGroup.js.map
