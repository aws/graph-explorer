import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const BarChartIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M6 15H3C2.17157 15 1.5 15.6716 1.5 16.5V21C1.5 21.8284 2.17157 22.5 3 22.5H6C6.82843
        22.5 7.5 21.8284 7.5 21V16.5C7.5 15.6716 6.82843 15 6 15Z"
      />
      <path
        fill="currentColor"
        d="M13.5 9H10.5C9.67157 9 9 9.67157 9 10.5V21C9 21.8284 9.67157 22.5 10.5 22.5H13.5C14.3284
        22.5 15 21.8284 15 21V10.5C15 9.67157 14.3284 9 13.5 9Z"
      />
      <path
        fill="currentColor"
        d="M21 1.5H18C17.1716 1.5 16.5 2.17157 16.5 3V21C16.5 21.8284 17.1716 22.5 18 22.5H21C21.8284
        22.5 22.5 21.8284 22.5 21V3C22.5 2.17157 21.8284 1.5 21 1.5Z"
      />
    </IconBase>
  );
};

export default BarChartIcon;
