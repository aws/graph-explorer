import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const MoreIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2
        .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2
        2-.9 2-2-.9-2-2-2z"
      />
    </IconBase>
  );
};

export default MoreIcon;
