import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const CaseQueueIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M19 4H3V6H19V4Z" fill="currentColor" />
      <path d="M19 8H3V10H19V8Z" fill="currentColor" />
      <path d="M13 12H3V14H13V12Z" fill="currentColor" />
      <path d="M10 16H3V18H10V16Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 12H14V15H11V23H23V15H20V12ZM19 15H15V13H19V15ZM18 18H16V20H18V18Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default CaseQueueIcon;
