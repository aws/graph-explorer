import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const MenuSelectorIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path fill="currentColor" d="M15 11l-3-4-3 4h6zM15 13l-3 4-3-4h6z" />
    </IconBase>
  );
};

export default MenuSelectorIcon;
