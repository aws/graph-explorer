import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const BarChartFilledIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4ZM15 8C15 7.44772 15.4477 7 16 7C16.5523 7 17 7.44772 17 8V16C17 16.5523 16.5523 17 16 17C15.4477 17 15 16.5523 15 16V8ZM11 10C11 9.44772 11.4477 9 12 9C12.5523 9 13 9.44772 13 10V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V10ZM8 11C7.44772 11 7 11.4477 7 12V16C7 16.5523 7.44772 17 8 17C8.55228 17 9 16.5523 9 16V12C9 11.4477 8.55228 11 8 11Z"
      />
    </IconBase>
  );
};

export default BarChartFilledIcon;
