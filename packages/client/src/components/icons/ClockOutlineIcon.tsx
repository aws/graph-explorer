import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ClockOutlineIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M11 7H12.5V12.25L17 14.92L16.25 16.15L11 13V7Z"
        fill="currentColor"
      />
      <path
        d="M2 12C2 6.48 6.47 2 11.99 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 11.99 22C6.47 22 2 17.52 2 12ZM4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default ClockOutlineIcon;
