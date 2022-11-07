import { useFocusRing } from "@react-aria/focus";
import { useRadio } from "@react-aria/radio";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { AriaRadioProps } from "@react-types/radio";
import { FC, useContext, useRef } from "react";
import type { IconButtonProps } from "../../IconButton";
import IconButton from "../../IconButton";

import { RadioContext } from "../RadioGroup";

export interface RadioButtonProps
  extends AriaRadioProps,
    Omit<IconButtonProps, "isSelected" | "toggle"> {
  classNamePrefix?: string;
}

export const RadioButton: FC<RadioButtonProps> = ({
  classNamePrefix = "ft",
  ...props
}) => {
  const { children } = props;
  const state = useContext(RadioContext);
  const ref = useRef(null);
  const { inputProps } = useRadio(props, state, ref);
  const { focusProps } = useFocusRing();
  const isSelected = state.selectedValue === props.value;

  return (
    <IconButton
      {...props}
      isSelected={isSelected}
      isDisabled={state.isDisabled || state.isReadOnly}
      toggle={() => state.setSelectedValue(props.value)}
      classNamePrefix={classNamePrefix}
    >
      {children}
      <VisuallyHidden>
        <input {...inputProps} name={state.name} {...focusProps} ref={ref} />
      </VisuallyHidden>
    </IconButton>
  );
};

export default RadioButton;
