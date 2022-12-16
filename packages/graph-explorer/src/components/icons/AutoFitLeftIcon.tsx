import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AutoFitLeftIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path
        stroke="currentColor"
        strokeWidth="2"
        d="M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v8"
      ></path>
      <path stroke="currentColor" strokeWidth="2" d="M20 18h-17"></path>
      <path stroke="currentColor" strokeWidth="2" d="M6 15l-3 3l3 3"></path>
    </IconBase>
  );
};

export default AutoFitLeftIcon;
