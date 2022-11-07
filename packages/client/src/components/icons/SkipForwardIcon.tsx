import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const SkipForwardIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path d="M8 17L14 12L8 7V17Z" fill="currentColor" />
      <rect x="15" y="7" width="2" height="10" fill="currentColor" />
    </IconBase>
  );
};

export default SkipForwardIcon;
