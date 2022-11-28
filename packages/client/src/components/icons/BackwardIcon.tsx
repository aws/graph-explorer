import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const BackwardIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M15 7L9 12L15 17V7Z" fill="currentColor" />
    </IconBase>
  );
};

export default BackwardIcon;
