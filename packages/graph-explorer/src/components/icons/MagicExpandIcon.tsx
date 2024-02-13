import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

const MagicExpandIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        d="M18,11a1,1,0,0,1-1,1,5,5,0,0,0-5,5,1,1,0,0,1-2,0,5,5,0,0,0-5-5,1,1,0,0,1,0-2,5,5,0,0,0,5-5,1,1,0,0,1,2,0,5,5,0,0,0,5,5A1,1,0,0,1,18,11Z"
        fill="currentColor"
      />
    </IconBase>
  );
};

export default MagicExpandIcon;
