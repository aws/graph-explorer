import { cx } from "@emotion/css";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { useRadioGroup } from "@react-aria/radio";
import { RadioGroupState, useRadioGroupState } from "@react-stately/radio";
import type { AriaRadioGroupProps } from "@react-types/radio";
import { createContext, FC, useMemo } from "react";

import { radioGroupLabelStyles } from "./RadioGroup.styles";

export const RadioContext = createContext<
  RadioGroupState & { validationState?: "valid" | "invalid" }
>({
  name: "",
  isDisabled: false,
  isReadOnly: false,
  lastFocusedValue: null,
  selectedValue: null,
  setSelectedValue: () => {},
  setLastFocusedValue: () => {},
});

export interface RadioGroupProps extends AriaRadioGroupProps {
  classNamePrefix?: string;
  className?: string;
}

export const RadioGroup: FC<RadioGroupProps> = ({
  classNamePrefix = "ft",
  className,
  ...props
}) => {
  const { children, label, validationState } = props;
  const state = useRadioGroupState(props);
  const customState = useMemo(
    () => ({
      ...state,
      validationState: validationState,
    }),
    [state, validationState]
  );
  const { radioGroupProps, labelProps } = useRadioGroup(props, state);
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();
  return (
    <div {...radioGroupProps} className={className}>
      <span
        {...labelProps}
        className={cx(stylesWithTheme(radioGroupLabelStyles(classNamePrefix)), {
          [pfx("radioGroup-group-readonly")]: props.isReadOnly,
        })}
      >
        {label}
      </span>
      <RadioContext.Provider value={customState}>
        {children}
      </RadioContext.Provider>
    </div>
  );
};

export default RadioGroup;
