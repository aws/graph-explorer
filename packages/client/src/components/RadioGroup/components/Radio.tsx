import { cx } from "@emotion/css";
import { useTheme, useWithTheme, withClassNamePrefix } from "../../../core";

import { useFocusRing } from "@react-aria/focus";
import { useRadio } from "@react-aria/radio";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import type { AriaRadioProps } from "@react-types/radio";
import { FC, useContext, useRef } from "react";

import { RadioContext } from "../RadioGroup";
import { radioLabelStyles, radioStyles } from "../RadioGroup.styles";

export enum RadioSizes {
  "sm" = "sm",
  "md" = "md",
  "lg" = "lg",
}

interface RadioProps extends AriaRadioProps {
  /* size of the Checkbox sm, md or lg*/
  size?: RadioSizes;
  classNamePrefix?: string;
}

const defaultSizeMap: Record<RadioSizes, number> = {
  sm: 26,
  md: 28,
  lg: 32,
};

export const Radio: FC<RadioProps> = ({ classNamePrefix = "ft", ...props }) => {
  const { children, size, isDisabled } = props;
  const state = useContext(RadioContext);
  const ref = useRef(null);
  const { inputProps } = useRadio(props, state, ref);
  const { isFocusVisible, focusProps } = useFocusRing();
  const [theme] = useTheme();

  const sizeMap = theme?.theme?.radio?.sizes || defaultSizeMap;

  const isSelected = state.selectedValue === props.value;
  const computedSize = sizeMap[size || "md"] || 28;
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <label
      style={{ display: "flex", alignItems: "center" }}
      className={cx(stylesWithTheme(radioLabelStyles(classNamePrefix)), {
        [pfx("radioGroup-label-readonly")]: state.isReadOnly,
        [pfx("radioGroup-label-disabled")]: state.isDisabled || isDisabled,
      })}
    >
      <VisuallyHidden>
        <input {...inputProps} name={state.name} {...focusProps} ref={ref} />
      </VisuallyHidden>
      <svg
        width={computedSize}
        height={computedSize}
        aria-hidden="true"
        className={cx(stylesWithTheme(radioStyles(classNamePrefix)), {
          [pfx("radioGroup-selected")]: isSelected,
          [pfx("radioGroup-disabled")]: state.isDisabled || isDisabled,
          [pfx("radioGroup-readonly")]: state.isReadOnly,
          [pfx("radioGroup-invalid")]: state.validationState === "invalid",
        })}
      >
        <circle
          cx={computedSize - 14}
          cy={computedSize - 14}
          r={computedSize - 20}
          fill="none"
          stroke={isSelected ? "#128ee5" : "gray"}
          strokeWidth={2}
        />
        {isSelected && (
          <circle
            className="indicator"
            cx={computedSize - 14}
            cy={computedSize - 14}
            r={computedSize - 24}
          />
        )}
        {isFocusVisible && (
          <circle
            className="focused"
            cx={computedSize - 14}
            cy={computedSize - 14}
            r={computedSize - 18}
            fill="none"
            stroke={theme.theme.palette.primary.main}
            strokeOpacity="0.5"
            strokeWidth={4}
          />
        )}
      </svg>
      {children}
    </label>
  );
};

export default Radio;
