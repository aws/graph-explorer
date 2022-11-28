import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const MenuIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default MenuIcon;
