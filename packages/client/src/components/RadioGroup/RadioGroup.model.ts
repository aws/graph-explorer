import { RadioSizes } from "./components/Radio";

type BaseRadioGroupTheme = {
  fill: string;
  stroke: string;
  label: {
    color: string;
  };
  error: {
    stroke: string;
  };
  selected: {
    fill: string;
    indicatorColor: string;
    stroke: string;
  };
  focus: {
    outlineColor: string;
  };
  disabledOpacity: string;
  sizes: Record<RadioSizes, number>;
};

export type RadioGroupTheme = {
  radio?: DeepPartial<BaseRadioGroupTheme>;
};
