import type { IconBaseProps } from "./IconBase";
import IconBase from "./IconBase";

export const ConnectedIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <path
        opacity="0.5"
        d="M6 5L14 17.5V19H11L6 11V19H2V5H6Z"
        fill="currentColor"
      />
      <path
        opacity="0.75"
        d="M14 5L22 17.5V19H19L14 11V15L10 9V5H14Z"
        fill="currentColor"
      />
      <path d="M22 5V15L18 9V5H22Z" fill="currentColor" />
    </IconBase>
  );
};

export default ConnectedIcon;
