import { CheckboxSizes } from "./Checkbox";

type BaseCheckboxTheme = {
  fill: string;
  stroke: string;
  label: {
    color: string;
  };
  error: {
    stroke: string;
  };
  checked: {
    fill: string;
    tickColor: string;
    stroke: string;
  };
  indeterminate: {
    fill: string;
    tickColor: string;
    stroke: string;
  };
  focus: {
    outlineColor: string;
  };
  disabledOpacity: string;
  sizes: Record<CheckboxSizes, number>;
};

export type CheckboxTheme = {
  checkbox?: DeepPartial<BaseCheckboxTheme>;
};
