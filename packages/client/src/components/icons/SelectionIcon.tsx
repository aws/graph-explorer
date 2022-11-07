import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const SelectionIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M17 5H15V3H17V5ZM15 21H17V18.41L19.59 21L21 19.59L18.41 17H21V15H15V21ZM19 9H21V7H19V9ZM19 13H21V11H19V13ZM11 21H13V19H11V21ZM7 5H9V3H7V5ZM3 17H5V15H3V17ZM5 21V19H3C3 20.1 3.9 21 5 21ZM19 3V5H21C21 3.9 20.1 3 19 3ZM11 5H13V3H11V5ZM3 9H5V7H3V9ZM7 21H9V19H7V21ZM3 13H5V11H3V13ZM3 5H5V3C3.9 3 3 3.9 3 5Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default SelectionIcon;
