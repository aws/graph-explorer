import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const DropdownIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path fill="currentColor" d="M12 15l4-5H8l4 5z" />
    </IconBase>
  );
};

export default DropdownIcon;
