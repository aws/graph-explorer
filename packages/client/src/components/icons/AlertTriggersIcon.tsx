import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AlertTriggersIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M11 3L6 4V12L11 11L12 11.5L17 10V2L12 3.5L11 3Z"
        fill="currentColor"
      />
      <path d="M3 4H5V20H3V4Z" fill="currentColor" />
      <path
        d="M18 12C18.5523 12 19 12.4473 19 13V13.126C20.7253 13.5703 22 15.1367 22 17V20L23 20.5V22H13V20.5L14 20V17C14 15.1367 15.2747 13.5703 17 13.126V13C17 12.4473 17.4477 12 18 12Z"
        fill="currentColor"
      />
      <path
        d="M18 24C17.4477 24 17 23.5527 17 23H19C19 23.5527 18.5523 24 18 24Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default AlertTriggersIcon;
