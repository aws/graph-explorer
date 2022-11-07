import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const AlertQueueIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M3 4H19V6H3V4Z" fill="currentColor" />
      <path d="M3 8H19V10H3V8Z" fill="currentColor" />
      <path d="M12 12H3V14H12V12Z" fill="currentColor" />
      <path d="M3 16H12V18H3V16Z" fill="currentColor" />
      <path
        d="M19 13C19 12.4473 18.5523 12 18 12C17.4477 12 17 12.4473 17 13V13.126C15.2747 13.5703 14 15.1367 14 17V20L13 20.5V22H23V20.5L22 20V17C22 15.1367 20.7253 13.5703 19 13.126V13Z"
        fill="currentColor"
      />
      <path
        d="M17 23C17 23.5527 17.4477 24 18 24C18.5523 24 19 23.5527 19 23H17Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default AlertQueueIcon;
