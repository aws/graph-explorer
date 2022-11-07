import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const DropupIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        transform="rotate(180,12,12)"
        d="M12 15l4-5H8l4 5z"
      />
    </IconBase>
  );
};

export default DropupIcon;
