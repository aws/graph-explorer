import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const PlayIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path fill="currentColor" d="M8 5v14l11-7L8 5z" />
    </IconBase>
  );
};

export default PlayIcon;
