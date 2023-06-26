import React, { forwardRef, useState, useEffect, useMemo } from 'react';
import { usePrevious } from '@mantine/hooks';
import { MachineNumber } from './MachineNumber.js';
import useStyles from './Machine.styles.js';

const Machine = forwardRef(({ value = 0, max }, ref) => {
  const [oldValue, setOldValue] = useState();
  const [newValue, setNewValue] = useState();
  const prevValueRef = usePrevious(value);
  useEffect(() => {
    if (typeof value === "string") {
      setOldValue(void 0);
      setNewValue(void 0);
    } else if (typeof prevValueRef === "string") {
      setOldValue(void 0);
      setNewValue(value);
    } else {
      setOldValue(prevValueRef);
      setNewValue(value);
    }
  }, [value, prevValueRef]);
  const numbers = useMemo(() => {
    if (typeof value === "string") {
      return [];
    }
    if (value < 1) {
      return [0];
    }
    const result = [];
    let currentValue = value;
    if (typeof max === "number") {
      currentValue = Math.min(max, currentValue);
    }
    while (currentValue >= 1) {
      result.push(currentValue % 10);
      currentValue /= 10;
      currentValue = Math.floor(currentValue);
    }
    result.reverse();
    return result;
  }, [value, max]);
  const { classes } = useStyles(null, { name: "machine" });
  return typeof value === "string" ? /* @__PURE__ */ React.createElement("span", {
    ref
  }, value) : /* @__PURE__ */ React.createElement("span", {
    ref,
    className: classes.base
  }, numbers.map((number, i) => /* @__PURE__ */ React.createElement(MachineNumber, {
    key: numbers.length - i - 1,
    value: number,
    oldOriginalNumber: oldValue,
    newOriginalNumber: newValue
  })), typeof max === "number" && value > max && /* @__PURE__ */ React.createElement("span", null, "+"));
});

export { Machine };
//# sourceMappingURL=Machine.js.map
