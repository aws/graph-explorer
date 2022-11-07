import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const SkipBackwardIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M16 7L10 12L16 17V7Z" fill="currentColor" />
      <rect x="7" y="7" width="2" height="10" fill="currentColor" />
    </IconBase>
  );
};

export default SkipBackwardIcon;
