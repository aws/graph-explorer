import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const PauseIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </IconBase>
  );
};

export default PauseIcon;
