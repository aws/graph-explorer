import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const FlagIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default FlagIcon;
