import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const SidebarIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M21 9L13 9V11L21 11V9ZM21 5L13 5V7L21 7V5ZM21 13H13V15H21V13ZM21 19V17H13V19H21ZM11 19L3 19V5H11L11 19Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default SidebarIcon;
